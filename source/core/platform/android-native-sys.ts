import {
    AdType,
    BaseSysFunc,
    IAds, IBannerAd, IFloatAd,
    IInitResult,
    ILog,
    ILogin,
    IPayment,
    IPlatformConf,
    IShare, PluginError, PluginResult, PluginShareResult,
    PluginStatus, PluginUserResult
} from "./BaseSysFunc";
import {EventName} from "../Constants";
import {eventManager} from "../EventManager";
import {DataStorage} from '../data'
import {Log} from '../../Log'
import {DeepCopy} from '../Functions'

const PAYMENT_PARMA_KEY: string = 'paymentParma';


export interface IAndroidNativePTConf extends IPlatformConf {
    componentName: string;
}

class PluginAdResult extends PluginResult {
    private readonly _adType: AdType;

    get adType(): AdType {
        return this._adType;
    }

    constructor(adType: AdType) {
        super();
        this._adType = adType;
    }

    static fromJson(jsonObj: object): PluginAdResult {
        let map = new Map(Object.entries(jsonObj));
        let adType: AdType = AdType.Banner;
        if (map.has('adType')) {
            adType = map.get('adType');
        }
        let o = new PluginAdResult(adType);
        if (map.has('error')) {
            o.error = PluginError.fromJson(map.get('error'));
        }

        return o;
    }
}


declare const pluginx: any;

export class AndroidNativeSys extends BaseSysFunc {

    private paymentParma?: IPayment;

    constructor() {
        super();
        pluginx.PluginHelper.addPaymentResultListener(this.onPaymentResult.bind(this));
    }

    get ptConf(): IAndroidNativePTConf {
        return this._conf as IAndroidNativePTConf;
    }

    init(conf: IAndroidNativePTConf, initResult?: IInitResult) {
        conf.componentName ??= 'google'
        super.init(conf, initResult);
        initResult?.success && initResult?.success();
    }


    showToast(msg: string, duration?: number) {
        if (undefined != duration) {
            pluginx.PluginHelper.showToast(msg, duration);
        } else {
            pluginx.PluginHelper.showToast(msg);
        }
    }

    showRewardedVideoAd(obj?: IAds) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.showRewardedVideoAd(componentName, (pluginStatus: PluginStatus, data: string) => {
            let pluginAdResult = PluginAdResult.fromJson(JSON.parse(data));
            if (AdType.RewardedVideo == pluginAdResult.adType) {
                Log.l('showRewardedVideoAd onAdResult statusCodes ' + pluginStatus, data);
                if (PluginStatus.Success == pluginStatus) {
                    obj?.success && obj?.success();
                } else {
                    obj?.fail && obj?.fail(pluginStatus, pluginAdResult.error);
                }
            }
        });
    }

    showRewardedInterstitialAd(obj?: IAds) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.showRewardedInterstitialAd(componentName, (pluginStatus: PluginStatus, data: string) => {
            let pluginAdResult = PluginAdResult.fromJson(JSON.parse(data));
            if (AdType.RewardedInterstitial == pluginAdResult.adType) {
                Log.l('showRewardedInterstitialAd onAdResult statusCodes ' + pluginStatus, data);
                if (PluginStatus.Success == pluginStatus) {
                    obj?.success && obj?.success();
                } else {
                    obj?.fail && obj?.fail(pluginStatus, pluginAdResult.error);
                }
            }
        });
    }

    showInterstitialAd(obj?: IAds) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.showInterstitialAd(componentName, (pluginStatus: PluginStatus, data: string) => {
            let pluginAdResult = PluginAdResult.fromJson(JSON.parse(data));
            if (AdType.Interstitial == pluginAdResult.adType) {
                Log.l('showInterstitialAd onAdResult statusCodes ' + pluginStatus, data);
                if (PluginStatus.Success == pluginStatus) {
                    obj?.success && obj?.success();
                } else {
                    obj?.fail && obj?.fail(pluginStatus, pluginAdResult.error);
                }
            }
        });
    }

    showFloatAd(obj?: IFloatAd) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.showFloatAd(componentName);
    }

    hideFloatAd(obj?: IFloatAd) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.hideBannerAd(componentName);
    }

    showBannerAd(obj?: IBannerAd) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.showBannerAd(componentName);
    }


    hideBannerAd(obj?: IBannerAd) {
        let componentName = this.getComponentName(obj?.componentName);
        pluginx.PluginHelper.hideBannerAd(componentName);
    }

    logEvent(data: ILog) {
        const {componentName, eventId, param} = data;
        Log.l('LogAnalyticsEvent Flurry/Google eventId: ' + eventId + ' param: ', param);

        let values: string = '';
        if (!!param) {
            if ('string' == typeof param) {
                values = param;
            } else {
                param.forEach((value, key) => {
                    values += key + ',' + value + ';';
                });
                values = values.substr(0, values.length - 1);
            }
        }
        let fixedComponentName = this.getComponentName(componentName);
        pluginx.PluginHelper.logEvent(fixedComponentName, eventId, values);
    }

    private onPaymentResult(pluginStatus: PluginStatus, data: string) {
        Log.l('onPaymentResult pluginStatus ' + pluginStatus, data);
        if (PluginStatus.Success == pluginStatus) {
            if (undefined != this.paymentParma) {
                if (undefined == data) DataStorage.clearData(PAYMENT_PARMA_KEY);
                this.paymentParma.success && this.paymentParma.success();
            } else {
                if (undefined != data) {
                    let paymentProductData = DataStorage.readData(PAYMENT_PARMA_KEY);
                    if (null != paymentProductData) {
                        let pluginAdResult = PluginAdResult.fromJson(JSON.parse(data));
                        paymentProductData.payMsg = pluginAdResult.error?.errMsg;
                        Log.l('onPaymentResult 遗留 retry handle');
                    }
                }
            }
        } else {
            let pluginAdResult = PluginAdResult.fromJson(JSON.parse(data));
            if (undefined != this.paymentParma) {
                if (null != this.paymentParma.fail)
                    this.paymentParma.fail(pluginStatus, pluginAdResult.error);
                else eventManager.emit(EventName.ShowToast, pluginAdResult?.error?.errMsg);
            } else {
                eventManager.emit(EventName.ShowToast, pluginAdResult?.error?.errMsg);
            }
        }
    }

    paymentWithProduct(obj: IPayment) {
        if (null != obj.productData && '' != obj.productData) {
            this.paymentParma = obj;
            let newProductData = DeepCopy(obj.productData);
            newProductData.productId = obj.productData.productId;
            DataStorage.saveData(PAYMENT_PARMA_KEY, newProductData)
            let componentName = this.getComponentName(obj.componentName);
            pluginx.PluginHelper.paymentWithProductId(componentName, obj.productData.productId)
        } else Log.l('productData is null!');
    }

    signIn(obj: ILogin) {
        let componentName = this.getComponentName(obj.componentName);
        pluginx.PluginHelper.signIn(componentName, (pluginStatus: PluginStatus, data: string) => {
            Log.l('onLoginResult statusCodes ' + pluginStatus, data);
            let pluginResult = PluginUserResult.fromJson(JSON.parse(data));
            if (PluginStatus.Success == pluginStatus) {
                obj?.success && obj?.success(pluginResult);
            } else {
                obj?.fail && obj?.fail(pluginStatus, pluginResult.error);
            }
        });
    }

    signOut(obj: ILogin) {
        let componentName = this.getComponentName(obj.componentName);
        pluginx.PluginHelper.signOut(componentName, (pluginStatus: PluginStatus, data: string) => {
            Log.l('onLoginResult statusCodes ' + pluginStatus, data);
            let pluginResult = PluginUserResult.fromJson(JSON.parse(data));
            if (PluginStatus.Success == pluginStatus) {
                obj?.success && obj?.success(pluginResult);
            } else {
                obj?.fail && obj?.fail(pluginStatus, pluginResult.error);
            }
        });
    }

    share(obj: IShare) {
        let componentName = this.getComponentName(obj.componentName);
        pluginx.PluginHelper.share(componentName, obj.shareContent.toJson(), (pluginStatus: PluginStatus, data: string) => {
            Log.l('onShareResult statusCodes ' + pluginStatus, data);
            let pluginResult = PluginShareResult.fromJson(JSON.parse(data));
            if (PluginStatus.Success == pluginStatus) {
                obj?.success && obj?.success(pluginResult);
            } else {
                obj?.fail && obj?.fail(pluginStatus, pluginResult.error);
            }
        });
    }

    private getComponentName(componentName?: string) {
        return componentName ?? this.ptConf.componentName;
    }
}