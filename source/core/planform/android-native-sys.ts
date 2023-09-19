import {
    AdType,
    IAdResult,
    ILogin,
    IPayment,
    IShare,
    PayResult,
    PluginStatusCodes,
    BaseSysFunc,
    IPlatformConf, IInitResult
} from "./BaseSysFunc";
import {native} from "../cc-env";
import {EventName} from "../Constants";
import {eventManager} from "../EventManager";
import {DataStorage} from '../data'
import {Log} from '../../Log'
import {DeepCopy} from '../Functions'

const JAVA_CLASS_NAME = 'com/pluginx/core/ScriptCallJavaBridge';
const PAYMENT_PARMA_KEY: string = 'paymentParma';

export interface IAndroidNativePTConf extends IPlatformConf {
    channelName: string;
}

export class AndroidNativeSys extends BaseSysFunc {
    private adParma?: IAdResult;
    private paymentParma?: IPayment;
    private loginParma?: ILogin;
    private shareParma?: IShare;
    private channelName = 'Google' // Google
    constructor() {
        super();
        eventManager.on(this, this.onShowAdResult, 'onShowAdResult');
        eventManager.on(this, this.onPaymentResult, 'onPaymentResult');
        eventManager.on(this, this.onLoginResult, 'onLoginResult')
        eventManager.on(this, this.onShareResult, 'onShareResult')
    }

    init(conf: IAndroidNativePTConf, initResult?: IInitResult) {
        super.init(conf, initResult);
        this.channelName = conf.channelName;
        initResult?.success && initResult?.success();
    }

    private onShowAdResult(adType: AdType, code: number, pluginErr?: string) {
        Log.l('adType:', adType, "PluginStatusCodes:", code, "pluginErr:", pluginErr);
        if (PluginStatusCodes.Succeed == code) {
            this.adParma?.success && this.adParma?.success()
        } else {
            if (undefined != pluginErr)
                this.adParma?.fail && this.adParma?.fail(JSON.parse(pluginErr))
            else this.adParma?.fail && this.adParma?.fail();
        }
        this.adParma = undefined;
    }


    showToast(msg: string, duration?: number) {
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "showToast", "(Ljava/lang/String;)V", msg);
    }

    showRewardedVideoAd(obj?: IAdResult) {
        this.adParma = obj;
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "showRewardedVideoAd", "(Ljava/lang/String;)V", this.channelName);
    }

    showRewardedInterstitialAd(obj?: IAdResult) {
        this.adParma = obj;
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "showRewardedInterstitialAd", "(Ljava/lang/String;)V", this.channelName);
    }

    showInterstitialAd(obj?: IAdResult) {
        this.adParma = obj;
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "showInterstitialAd", "(Ljava/lang/String;)V", this.channelName);
    }

    showFloatAd() {
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "floatAdVisible", "(Ljava/lang/String;Z)V", this.channelName, true);
    }

    hideFloatAd() {
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "floatAdVisible", "(Ljava/lang/String;Z)V", this.channelName, false);
    }

    showBannerAd(obj = {}) {
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "bannerAdVisible", "(Ljava/lang/String;Z)V", this.channelName, true);
    }


    hideBannerAd() {
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "bannerAdVisible", "(Ljava/lang/String;Z)V", this.channelName, false);
    }

    logEvent(eventId: string, param?: string | Map<string, string>) {
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
        // jsb.reflection.callStaticMethod(JAVA_CLASS_NAME, "logEvent", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", 'Flurry', eventId, values);
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "logEvent", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", 'Google', eventId, values);
    }

    private onPaymentResult(payResult: PayResult, pluginErr?: { errMsg: string }) {
        Log.l('onPaymentResult payResult ' + payResult, pluginErr);
        if (PayResult.Success == payResult) {
            if (undefined != this.paymentParma) {
                if (undefined == pluginErr) DataStorage.clearData(PAYMENT_PARMA_KEY);
                this.paymentParma.success && this.paymentParma.success();
            } else {
                if (undefined != pluginErr) {
                    let paymentProductData = DataStorage.readData(PAYMENT_PARMA_KEY);
                    if (null != paymentProductData) {
                        paymentProductData.payMsg = pluginErr.errMsg;
                        DataStorage.saveData(PAYMENT_PARMA_KEY, paymentProductData);
                        Log.l('onPaymentResult 遗留 retry handle');
                    }
                }
            }
        } else {
            if (undefined != this.paymentParma) {
                if (null != this.paymentParma.fail)
                    this.paymentParma.fail(payResult);
                else eventManager.emit(EventName.ShowToast, pluginErr?.errMsg);
            } else {
                eventManager.emit(EventName.ShowToast, pluginErr?.errMsg);
            }
        }
    }

    paymentWithProduct(obj: IPayment) {
        if (null != obj.productData && '' != obj.productData) {
            this.paymentParma = obj;
            let newProductData = DeepCopy(obj.productData);
            newProductData.productId = obj.productData.productId;
            DataStorage.saveData(PAYMENT_PARMA_KEY, newProductData)
            native.reflection.callStaticMethod(JAVA_CLASS_NAME, "paymentWithProductId", "(Ljava/lang/String;Ljava/lang/String;)V", this.channelName, newProductData.productId);
        } else Log.l('productData is null!');
    }

    logIn(obj: ILogin) {
        this.loginParma = obj;
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "signIn", "(Ljava/lang/String;)V", obj.sdkKeyWord);
    }

    share(obj: IShare) {
        this.shareParma = obj;
        native.reflection.callStaticMethod(JAVA_CLASS_NAME, "share", "(Ljava/lang/String;)V", obj.sdkKeyWord);
    }

    private onLoginResult(statusCodes: PluginStatusCodes, result: string) {
        Log.l('onLoginResult statusCodes ' + statusCodes, result);
        if (PluginStatusCodes.Succeed == statusCodes) {
            return this.loginParma?.success && this.loginParma?.success(JSON.parse(result));
        }
        this.loginParma?.fail && this.loginParma?.fail(JSON.parse(result));
    }

    private onShareResult(statusCodes: PluginStatusCodes, result: string) {
        Log.l('onShareResult statusCodes ' + statusCodes, result);
        if (PluginStatusCodes.Succeed == statusCodes) {
            return this.shareParma?.success && this.shareParma?.success(JSON.parse(result));
        }
        this.shareParma?.fail && this.shareParma?.fail(JSON.parse(result));
    }
}