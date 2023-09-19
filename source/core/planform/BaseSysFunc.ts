import {Log} from "../../Log";

export enum AdType {
    RewardedVideo,
    RewardedInterstitial,
    Interstitial,
    Banner
}

export enum AdState {
    None,
    Loading,
    Loaded,
    Watched,
    NotWatchComplete,
    Error,
}

interface ICompleteCallBack {
    success?: Function;
    fail?: Function;
}

export interface IPayment extends ICompleteCallBack {
    productData: any;
}

export interface IAdResult extends ICompleteCallBack {

}

export interface IInitResult extends ICompleteCallBack {

}

export interface ILogin extends ICompleteCallBack {
    sdkKeyWord: string;
}

export interface IShare extends ICompleteCallBack {
    sdkKeyWord: string;
}

export enum PluginStatusCodes {
    Succeed, Failed, Canceled,
}

export enum PayResult {
    Success,
    Fail,
    Cancel,
}

export interface IPluginError {
    code?: number;
    errMsg?: string;
}

export interface IPlatformConf {

}

export interface IBannerConf {
}

export interface IBanner extends IAdResult {
    conf?: IBannerConf;
}

export class BaseSysFunc {
    protected _conf?: IPlatformConf;
    protected _bLoadingAdMap: any;
    protected _bLoadingAdSuccessMap: any;
    private _bannerConf?: IBannerConf;

    constructor() {
        this._bLoadingAdMap = {};
        this._bLoadingAdSuccessMap = {};
    }

    init(conf: IPlatformConf, initResult ?: IInitResult) {
        this._conf = conf;
    }


    showToast(msg: string, duration?: number) {
        Log.l('showToast', msg);
    }

    /*********************************************Ad*********************************************/

    showBannerAd(banner?: IBanner) {
        this._bannerConf = banner?.conf;
    }

    protected forceCreateBannerAd() {
    }

    isBannerAdShow() {
        return false;
    }

    destroyBannerAd() {
    }

    hideBannerAd() {
    }

    preLoadRewardedVideoAd(obj ?: IAdResult) {
    }

    showRewardedVideoAd(obj?: IAdResult) {
        obj?.success && obj?.success();
    }

    preLoadInterstitialAd(obj?: IAdResult) {
    }

    showInterstitialAd(obj?: IAdResult) {
    }

    preLoadRewardedInterstitialAd(obj?: IAdResult) {
    }

    showRewardedInterstitialAd(obj?: IAdResult) {
    }

    createNativeAd(posId?: string) {
    }

    showFloatAd() {
    }

    hideFloatAd() {
    }

    showRewardedAds(obj: IAdResult) {
        this.showRewardedVideoAd({
            success: () => obj?.success && obj?.success(),
            fail: () =>
                this.showRewardedInterstitialAd({
                    success: () => obj?.success && obj?.success(),
                    fail: () => this.showInterstitialAd(obj)
                })
        });
    }

    /*********************************************Payment*********************************************/

    paymentWithProduct(obj: IPayment) {
        obj?.success && obj?.success();
    }

    /*********************************************Social*********************************************/

    logIn(obj: ILogin) {
        obj?.success && obj?.success();
    }

    share(obj: IShare) {
        obj?.success && obj?.success();
    }

    /*********************************************Log*********************************************/
    logEvent(eventId: string, param?: string | Map<string, string>) {
        Log.l('logEvent eventId: ' + eventId + ' param: ', param);
    }
}