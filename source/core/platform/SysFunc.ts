import {sys} from "cc";
import {Log} from "../../Log";
import {AndroidNativeSys} from "./android-native-sys";
import {
    BaseSysFunc,
    IAds,
    IPlatformConf,
    ILogin,
    IPayment,
    IShare,
    IInitResult,
    ILog,
    IFloatAd,
    IBannerAd
} from "./BaseSysFunc";

export enum SysPlatformType {
    native,
    web_default,
    web_cray_games,
}

export interface IPlatformInit {
    platformType?: SysPlatformType;
    platformConf?: IPlatformConf;
    initResult?: IInitResult;
}

export class SysFunc {
    private static _instance?: SysFunc;
    private _sysFunc?: BaseSysFunc;

    static get Instance(): SysFunc {
        this._instance ??= new SysFunc();
        return this._instance;
    }

    private constructor() {
    }

    private checkInitialized() {
        if (null == this._sysFunc) {
            Log.e('SysFunc not initialize!');
            return false
        }
        return true;
    }

    showToast(msg: string, duration?: number) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.showToast(msg, duration);
    }

    // showModal(o: any) {}

    showRewardedVideoAd(obj ?: IAds) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.showRewardedVideoAd(obj);
    }

    showRewardedInterstitialAd(obj ?: IAds) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.showRewardedInterstitialAd(obj);
    }

    showInterstitialAd(obj ?: IAds) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.showInterstitialAd(obj);
    }

    showFloatAd(obj?: IFloatAd) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.showFloatAd(obj);
    }

    hideFloatAd(obj?: IFloatAd) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.hideFloatAd(obj);
    }

    showBannerAd(obj?: IBannerAd) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.showBannerAd(obj);
    }

    hideBannerAd(obj?: IBannerAd) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.hideBannerAd(obj);
    }

    paymentWithProduct(obj: IPayment) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.paymentWithProduct(obj);
    }

    initSdk(platformInit?: IPlatformInit) {
        const {platformType, platformConf, initResult} = platformInit ?? {};
        if (this._sysFunc) return Log.i('SysFunc already initialized!')
        if (sys.isNative) {
            if (sys.Platform.ANDROID == sys.platform)
                this._sysFunc = new AndroidNativeSys();
        } else {
            if (sys.isBrowser) {
                /*if (SysPlatformType.web_cray_games == platformType)
                    this._sysFunc = new CrazyGamesSysFunc();
                else*/
                this._sysFunc = new BaseSysFunc();
            }
        }
        this._sysFunc?.init(platformConf ?? {}, initResult ?? {
            success: () => {
                this._sysFunc!.preLoadInterstitialAd();
                this._sysFunc!.preLoadRewardedVideoAd();
                this._sysFunc!.preLoadRewardedInterstitialAd();
            }
        });
    }

    showAds(obj: IAds) {
        if (!this.checkInitialized()) return;
        this.showRewardedVideoAd({
            componentName: obj.componentName,
            success: (pluginResult) => obj?.success && obj?.success(pluginResult),
            fail: (pluginStatus, error) =>
                this.showRewardedInterstitialAd({
                    componentName: obj.componentName,
                    success: (pluginResult) => obj?.success && obj?.success(pluginResult),
                    fail: (pluginStatus, error) => this.showInterstitialAd(obj)
                })
        });
    }

    logEvent(data: ILog) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.logEvent(data);
    }

    signIn(obj: ILogin) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.signIn(obj);
    }

    signOut(obj: ILogin) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.signOut(obj);
    }

    share(obj: IShare) {
        if (!this.checkInitialized()) return;
        this._sysFunc?.share(obj);
    }
}