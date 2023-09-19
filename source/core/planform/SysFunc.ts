import {sys} from "cc";
import { Log } from "../../Log";
import {AndroidNativeSys} from "./android-native-sys";
import {BaseSysFunc, IAdResult, IPlatformConf, ILogin, IPayment, IShare, IInitResult} from "./BaseSysFunc";

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

    showToast(msg: string, duration?: number) {
        this._sysFunc?.showToast(msg, duration);
    }

    // showModal(o: any) {}

    showRewardedVideoAd(obj ?: IAdResult) {
        this._sysFunc?.showRewardedVideoAd(obj);
    }

    showRewardedInterstitialAd(obj ?: IAdResult) {
        this._sysFunc?.showRewardedInterstitialAd(obj);

    }

    showInterstitialAd(obj ?: IAdResult) {
        this._sysFunc?.showInterstitialAd(obj);
    }

    showFloatAd() {
        this._sysFunc?.showFloatAd();
    }

    hideFloatAd() {
        this._sysFunc?.hideFloatAd();
    }

    showBannerAd() {
        this._sysFunc?.showBannerAd();
    }

    hideBannerAd() {
        this._sysFunc?.hideBannerAd();
    }

    paymentWithProduct(obj: IPayment) {
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

    showAds(obj: IAdResult) {
        this.showRewardedVideoAd({
            success: () => obj?.success && obj?.success(),
            fail: () =>
                this.showRewardedInterstitialAd({
                    success: () => obj?.success && obj?.success(),
                    fail: () => this.showInterstitialAd(obj)
                })
        });
    }

    logEvent(eventId: string, param?: string | Map<string, string>) {
        this._sysFunc?.logEvent(eventId, param);
    }

    logIn(obj: ILogin) {
        this._sysFunc?.logIn(obj);
    }

    share(obj: IShare) {
        this._sysFunc?.share(obj);
    }
}