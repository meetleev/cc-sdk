import {Log} from "../../Log";

export enum PluginStatus {
    Success, Failed, Canceled,
}

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


export class PluginError {
    private readonly _code: number;
    get code(): number {
        return this._code;
    }


    private readonly _errMsg: string;
    get errMsg(): string {
        return this._errMsg;
    }

    constructor(code: number, errMsg: string) {
        this._code = code;
        this._errMsg = errMsg;
    }

    static fromJson(jsonObj: object): PluginError {
        let map = new Map(Object.entries(jsonObj));
        let code: number = -1;
        if (map.has('code')) {
            code = map.get('code');
        }

        let errMsg: string = '';
        if (map.has('errMsg')) {
            errMsg = map.get('errMsg');
        }
        return new PluginError(code, errMsg);
    }
}

export class PluginResult {
    error?: PluginError;

    static fromJson(jsonObj: Object): PluginResult {
        let map = new Map(Object.entries(jsonObj));
        let o = new PluginResult();
        if (map.has('error')) {
            o.error = PluginError.fromJson(map.get('error'));
        }
        return o;
    }
}

export class PluginShareResult extends PluginResult {
    private readonly _postId: String;

    get postId(): String {
        return this._postId;
    }

    constructor(postId: String) {
        super();
        this._postId = postId;
    }

    static fromJson(jsonObj: object): PluginShareResult {
        let map = new Map(Object.entries(jsonObj));
        let postId: String = '';
        if (map.has('postId')) {
            postId = map.get('postId');
        }
        let o = new PluginShareResult(postId);
        if (map.has('error')) {
            o.error = PluginError.fromJson(map.get('error'));
        }
        return o;
    }
}

export class PluginUserResult extends PluginResult {

    id: string = '';
    gamerTitle: string = '';
    iconImageUrl: string = '';
    email: string = '';


    static fromJson(jsonObj: object): PluginUserResult {
        let map = new Map(Object.entries(jsonObj));
        let o = new PluginUserResult();
        if (map.has('id')) {
            o.id = map.get('id');
        }
        if (map.has('gamerTitle')) {
            o.gamerTitle = map.get('gamerTitle');
        }
        if (map.has('iconImageUrl')) {
            o.iconImageUrl = map.get('iconImageUrl');
        }
        if (map.has('email')) {
            o.email = map.get('email');
        }
        if (map.has('error')) {
            o.error = PluginError.fromJson(map.get('error'));
        }
        return o;
    }
}

interface ICompleteCallBack<T extends PluginResult> {
    success?: (pluginResult?: T) => void;
    fail?: (pluginStatus: PluginStatus, error?: PluginError) => void;
}

export interface IPayment extends ICompleteCallBack<PluginResult> {
    componentName?: string;
    productData: any;
}

export interface IAds extends ICompleteCallBack<PluginResult> {
    componentName?: string;
}

export interface IInitResult extends ICompleteCallBack<PluginResult> {
    componentName?: string;
}

export interface ILogin extends ICompleteCallBack<PluginUserResult> {
    componentName?: string;
}

export interface IShare extends ICompleteCallBack<PluginShareResult> {
    componentName?: string;
    shareContent: ShareInfo;
}

export interface ILog {
    componentName?: string;
    eventId: string;
    param?: string | Map<string, string>
}


export interface IPlatformConf {

}

export interface IBannerAdConf {
}

export interface IBannerAd extends IAds {
    conf?: IBannerAdConf;
}

export interface IFloatAd extends IAds {
}

export enum ShareContentType {
    Link, Image, Video
}

export class ShareInfo {
    private readonly _contentType: ShareContentType;
    private readonly _url: string;
    private _tag?: string;

    set tag(value: string) {
        this._tag = value;
    }

    constructor(contentType: ShareContentType, url: string, tag?: string) {
        this._contentType = contentType;
        this._url = url;
        this._tag = tag;
    }

    toJson() {
        let o = {'contentType': this._contentType, 'url': this._url}
        if (!!this._tag) {
            o['tag'] = this._tag;
        }
        return JSON.stringify(o);
    }
}

export class BaseSysFunc {
    protected _conf?: IPlatformConf;
    protected _bLoadingAdMap: any;
    protected _bLoadingAdSuccessMap: any;
    private _bannerAdConf?: IBannerAdConf;

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

    showBannerAd(banner?: IBannerAd) {
        this._bannerAdConf = banner?.conf;
    }

    protected forceCreateBannerAd() {
    }

    isBannerAdShow() {
        return false;
    }

    destroyBannerAd() {
    }

    hideBannerAd(obj?: IBannerAd) {
    }

    preLoadRewardedVideoAd(obj ?: IAds) {
    }

    showRewardedVideoAd(obj?: IAds) {
        obj?.success && obj?.success();
    }

    preLoadInterstitialAd(obj?: IAds) {
    }

    showInterstitialAd(obj?: IAds) {
    }

    preLoadRewardedInterstitialAd(obj?: IAds) {
    }

    showRewardedInterstitialAd(obj?: IAds) {
        obj?.success && obj?.success();
    }

    createNativeAd(posId?: string) {
    }

    showFloatAd(obj?: IFloatAd) {
    }

    hideFloatAd(obj?: IFloatAd) {
    }

    showRewardedAds(obj: IAds) {
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

    signIn(obj: ILogin) {
        obj?.success && obj?.success();
    }

    signOut(obj: ILogin) {
        obj?.success && obj?.success();
    }

    share(obj: IShare) {
        obj?.success && obj?.success();
    }

    /*********************************************Log*********************************************/
    logEvent(obj: ILog) {
        Log.l('logEvent eventId: ' + obj.eventId + ' param: ', obj.param);
    }
}