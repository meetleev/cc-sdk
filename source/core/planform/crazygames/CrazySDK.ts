import {error, sys} from "cc";

enum INIT_STATE {
    UNINITIALIZED,
    REQUESTED,
    INITIALIZED,
}

export type SdkEnvironment = "crazygames" | "yandex" | "facebook" | "local" | "disabled";

interface SDK {
    getEnvironment: (callback?: Callback<SdkEnvironment>) => Promise<SdkEnvironment | void>;
    readonly ad: AdModule;
    readonly banner: BannerAdModule;
    readonly game: GameModule;
}

interface AdModule {
    requestAd(adType: AdType, callbacks?: Partial<AdCallbacks>): Promise<void>;

    hasAdblock(callback?: Callback<boolean>): Promise<boolean | void>;
}

type BannerAdCallback = (error?: string, result?: any) => void;

interface BannerAdModule {
    requestBanner(conf: { id: string, width: number, height: number }, callBack: BannerAdCallback): Promise<void>;

    requestResponsiveBanner(containerId: string, callBack: BannerAdCallback): Promise<void>;

    clearBanner(containerId: string);

    clearAllBanners();
}

interface GameModule {
    happytime(callback?: Callback<void>): Promise<void>;

    gameplayStart(callback?: Callback<void>): Promise<void>;

    gameplayStop(callback?: Callback<void>): Promise<void>;

    sdkGameLoadingStart(callback?: Callback<void>): Promise<void>;

    sdkGameLoadingStop(callback?: Callback<void>): Promise<void>;

    inviteLink(params: { [key: string]: string }, callback?: Callback<string>): Promise<string>;
}

type AdType = "midgame" | "rewarded";

type AdCallbacks = {
    adStarted: () => void;
    adError: (error: string) => void;
    adFinished: () => void;
};

type Callback<E> = (error: string | void, result: E | void) => void;

class Logger {
    static Log(...args: any[]) {
        console.log("[CrazySDK]", ...args);
    }
}

class _CrazySDK {
    private initResolvers: (() => void)[] = [];
    private initState: INIT_STATE = INIT_STATE.UNINITIALIZED;
    private _sdk?: SDK;
    private _isEnabled: boolean = false;
    private _version = "1.0.0";

    get sdk(): SDK {
        return this._sdk!;
    }

    /*constructor() {

        (window as any).crazySdkInitOptions = {
            ...(window as any).crazySdkInitOptions,
            wrapper: {
                engine: "cocos",
                sdkVersion: this._version,
            },
        };
    }*/

    private get isSupportedPlatform(): boolean {
        const supportedPlatform = [sys.Platform.MOBILE_BROWSER, sys.Platform.DESKTOP_BROWSER];
        return supportedPlatform.indexOf(sys.platform) >= 0;
    }

    async getEnvironment(callback?: Callback<SdkEnvironment>): Promise<SdkEnvironment | void> {
        return this.sdk.getEnvironment(callback);
    }

    /** True if the SDK is enabled on this platform/website. If the SDK is disabled, the method calls will throw errors. */
    get isEnabled(): boolean {
        return this._isEnabled;
    }

    get ad(): AdModule {
        return {
            requestAd: async (adType, callbacks) => {
                await this.ensureLoad();
                await this.sdk.ad.requestAd(adType, callbacks);
            },
            hasAdblock: async (callback): Promise<boolean | void> => {
                await this.ensureLoad();
                return this.sdk.ad.hasAdblock(callback);
            },
        };
    }

    get banner(): BannerAdModule {
        return {
            requestBanner: async (conf: { id: string; width: number; height: number }, callback) => {
                await this.ensureLoad();
                await this.sdk.banner.requestBanner(conf, callback);
            },
            clearBanner: async (containerId: string) => {
                await this.ensureLoad();
                this.sdk.banner.clearBanner(containerId);
            },
            requestResponsiveBanner: async (containerId: string, callback) => {
                await this.ensureLoad();
                await this.sdk.banner.requestResponsiveBanner(containerId, callback);
            },
            clearAllBanners: async () => {
                await this.ensureLoad();
                this.sdk.banner.clearAllBanners();
            }
        };
    }

    get game(): GameModule {
        return {
            gameplayStart: async (callback) => {
                await this.ensureLoad();
                return this.sdk.game.gameplayStart(callback);
            },
            gameplayStop: async (callback) => {
                await this.ensureLoad();
                return this.sdk.game.gameplayStop(callback);
            },
            sdkGameLoadingStart: async (callback) => {
                await this.ensureLoad();
                return this.sdk.game.sdkGameLoadingStart(callback);
            },
            sdkGameLoadingStop: async (callback) => {
                await this.ensureLoad();
                return this.sdk.game.sdkGameLoadingStop(callback);
            },
            happytime: async (callback) => {
                await this.ensureLoad();
                return this.sdk.game.happytime(callback);
            },
            inviteLink: async (params, callback) => {
                await this.ensureLoad();
                return this.sdk.game.inviteLink(params, callback);
            },
        };
    }

    private loadJsSDK() {
        if (this.initState !== INIT_STATE.UNINITIALIZED) {
            return;
        }
        this.initState = INIT_STATE.REQUESTED;
        const tag = document.createElement("script");
        tag.src = "https://sdk.crazygames.com/crazygames-sdk-v2.js";
        tag.async = true;
        tag.onload = async () => {
            Logger.Log("JS SDK loaded");
            this._sdk = (window as any).CrazyGames.SDK;
            const environment = await this.sdk.getEnvironment();
            this._isEnabled = environment !== "disabled";
            this.initState = INIT_STATE.INITIALIZED;
            this.initResolvers.forEach((resolver) => resolver());
            this.initResolvers = [];
        };
        tag.onerror = () => error("Failed to load CrazySDK JS. Please check your internet connection.");
        document.head.appendChild(tag);
    }

    async initSDK() {
        await this.ensureLoad();
    }

    private async ensureLoad() {
        if (!this.isSupportedPlatform) {
            this._isEnabled = false;
            return Promise.reject('this platform is not support!');
        }
        if (this.initState === INIT_STATE.INITIALIZED) {
            return Promise.resolve();
        }
        this.loadJsSDK();
        return new Promise<void>((resolve) => {
            this.initResolvers.push(async () => {
                resolve();
            });
        });
    }
}

export {_CrazySDK as CrazySDK};
