import {IAdResult, BaseSysFunc, IInitResult, IPlatformConf, IBanner} from "../BaseSysFunc";
import {CrazySDK} from "./CrazySDK";

export class CrazyGamesSysFunc extends BaseSysFunc {
    private sdkInitErr: string = 'CrazySDK not enabled';
    private crazySDK: CrazySDK;

    constructor() {
        super();
        this.crazySDK = new CrazySDK();
    }

    init(conf: IPlatformConf, initResult?: IInitResult) {
        super.init(conf, initResult);
        this.crazySDK.initSDK().then(() => initResult?.success && initResult.success())
            .catch((err) => initResult?.fail && initResult.fail(err));
    }

    private checkSdkEnabled() {
        if (!this.crazySDK.isEnabled) {
            ccx.Log.e(this.sdkInitErr);
            return false;
        }
        return true;
    }

    showRewardedVideoAd(obj?: IAdResult) {
        if (!this.checkSdkEnabled()) return obj?.fail && obj?.fail(this.sdkInitErr);
        this.crazySDK.ad.requestAd("rewarded", {
            adError: (error) => {
                ccx.Log.e("Rewarded video error", error);
                obj?.fail && obj?.fail(error);
            },
            adStarted: () => {
                ccx.Log.l("Rewarded video started");
            },
            adFinished: () => {
                ccx.Log.l("Rewarded video finished");
                obj?.success && obj?.success();
            },
        });
    }

    showRewardedInterstitialAd(obj?: IAdResult) {
        if (!this.checkSdkEnabled()) return obj?.fail && obj?.fail(this.sdkInitErr);
        this.crazySDK.ad.requestAd("midgame", {
            adError: (error) => {
                ccx.Log.e("Ad break video error", error);
                obj?.fail && obj?.fail(error);
            },
            adStarted: () => {
                ccx.Log.l("Ad break video started");
            },
            adFinished: () => {
                ccx.Log.l("Ad break video finished");
                obj?.success && obj?.success();
            },
        });
    }

    showBannerAd(obj?: IBanner) {
        super.showBannerAd(obj);
        if (!this.checkSdkEnabled()) return obj?.fail && obj?.fail(this.sdkInitErr);
        this.hideBannerAd();
        this._createBanner();
    }

    private _createBanner() {
        this.crazySDK.banner.requestResponsiveBanner('responsive-banner-container', (error, result) => {
        });
    }

    hideBannerAd() {
        super.hideBannerAd();
        if (!this.checkSdkEnabled()) return;
        this.crazySDK.banner.clearAllBanners();
    }

    protected forceCreateBannerAd() {
        this._createBanner();
    }
}