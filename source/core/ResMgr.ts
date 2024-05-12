import {
    Asset,
    AudioClip,
    ImageAsset,
    Material,
    Prefab,
    resources,
    assetManager,
    sp,
    SpriteFrame,
    Texture2D,
    TiledMapAsset
} from "cc";
import {FileUtils} from "./utils/FileUtils";

class ResMgr {

    constructor() {
    }

    /**
     * Load the tiledMapAsset asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} url
     * @api public
     * @example
     * // load the tiledMapAsset (${project}/assets/resources/tiledMaps/map.tmx) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadTiledMap('tiledMaps/map').then( (texture) => console.log(texture) ).catch( (err) => console.log(err) );
     */
    loadTiledMap(url: string): Promise<TiledMapAsset> {
        return this.load<TiledMapAsset>(url);
    }

    /**
     * Load the audioClip asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} url
     * @api public
     * @example
     * // load the audioClip (${project}/assets/resources/audios/audio.mp3) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadAudio('audios/audio').then( (audioClip) => console.log(audioClip) ).catch( (err) => console.log(err) );
     */
    loadAudio(url: string): Promise<AudioClip> {
        return this.load<AudioClip>(url);
    }

    /**
     * Load the prefab asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} url
     * @api public
     * @example
     * // load the prefab (${project}/assets/resources/prefabs/ui.prefab) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadPrefab('prefabs/ui').then( (prefab) => console.log(prefab) ).catch( (err) => console.log(err) );
     */
    loadPrefab(url: string): Promise<Prefab> {
        return this.load<Prefab>(url);
    }

    /**
     * Load the texture2D asset within this bundle by the path which is relative to bundle's path or load remote image assets
     *
     * @param {String} url
     * @api public
     * @example
     * // load the texture2D (${project}/assets/resources/textures/bg.png) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadTexture('textures/bg').then( (texture2D) => {} ).catch( (err) => console.log(err) );
     */
    loadTexture(url: string): Promise<Texture2D> {
        return new Promise((resolve, reject) => {
            this.loadImageAssets(url).then((image) => {
                let tp = new Texture2D()
                tp.image = image;
                resolve(tp);
            }).catch((error) => reject(error));
        });
    }

    /**
     * Load the spriteFrame asset within this bundle by the path which is relative to bundle's path or load remote image assets
     *
     * @param {String} url
     * @api public
     * @example
     * // load the spriteFrame (${project}/assets/resources/textures/bg.png) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadSpriteFrame('textures/bg').then( (spriteFrame) => {} ).catch( (err) => console.log(err) );
     */
    loadSpriteFrame(url: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            this.loadImageAssets(url).then((image) => {
                resolve(SpriteFrame.createWithImage(image));
            }).catch((error) => reject(error));
        });
    }

    /**
     * Load the material asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} url
     * @api public
     * @example
     * // load the material (${project}/assets/resources/materials/bg.mat) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadMaterial('materials/bg').then( (material) => {} ).catch( (err) => console.log(err) );
     */
    loadMaterial(url: string): Promise<Material> {
        return this.load<Material>(url);
    }

    /**
     * Load the spine asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} url
     * @api public
     * @example
     * // load the spine (${project}/assets/resources/spines/bg.json) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadSkeletonData('spines/bg').then( (spine) => console.log(spine) ).catch( (err) => console.log(err) );
     */
    loadSkeletonData(url: string): Promise<sp.SkeletonData> {
        return this.load<sp.SkeletonData>(url);
    }

    /**
     * Load the imageAsset within this bundle by the path which is relative to bundle's path or load remote image assets
     *
     * @param {String} url
     * @api public
     * @example
     * // load the imageAsset (${project}/assets/resources/textures/bg.png) from resources
     * import { resMgr } from 'ccx';
     * resMgr.loadImageAssets('textures/bg').then( (imageAsset) => {}).catch( (err) => console.log(err) );
     */
    loadImageAssets(url: string): Promise<ImageAsset> {
        return this.load<ImageAsset>(url);
    }

    /**
     * Load the asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} url
     * @param {boolean} bLogError
     * @api public
     * @example
     * // load the material (${project}/assets/resources/texture2D/bg.png) from resources
     * import { resMgr } from 'ccx';
     * resMgr.load<Texture2D>('texture2D/bg').then( (texture) => console.log(texture) ).catch( (err) => console.log(err) );
     */
    load<T extends Asset>(url: string, bLogError: boolean = false): Promise<T> {
        const netRegex: RegExp = /^(https?)/i;
        const fileRegex: RegExp = /^(file:\/\/)/i;
        let type: { new(...args: any[]): T }
        return new Promise((resolve, reject) => {
            let cb = (err: Error | null, assets: T) => {
                if (!err) {
                    // this.resHash.set(assets.name, assets);
                    resolve(assets);
                } else {
                    !bLogError && console.log('load err ', err, `type = ${type} url = ${url}`);
                    reject(err);
                }
            };
            if (netRegex.test(url)) {
                assetManager.loadRemote<T>(url, cb);
            } else if (fileRegex.test(url)) {
                let newUrl = url.replace('file://', '');
                assetManager.loadRemote<T>(newUrl, cb);
            } else {
                let fileUrls = url.split('.');
                let fileUrl: string = url;
                if (1 < fileUrls.length) {
                    fileUrl = fileUrls[0];
                }
                resources.load(fileUrl, type, cb);
            }
        });
    }

    /**
     * Fetch assets url of the asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} path
     * @api public
     * @example
     * // Fetch assets url (${project}/assets/resources/texture2D/bg.png) from resources
     * import { resMgr } from 'ccx';
     * resMgr.getAssetsUrl('texture2D/bg').then( (url) => console.log(url)).catch( (err) => console.log(err) );
     */
    getAssetsUrl(path: string): Promise<string> {
        let fileUrls = path.split('.');
        let fileUrl: string = path;
        if (1 < fileUrls.length) {
            fileUrl = fileUrls[0];
        }
        return new Promise((resolve, reject) => {
            resources.load(fileUrl, (err, asset) => {
                if (null != err) {
                    reject(err);
                } else {
                    resolve(asset.nativeUrl);
                }
            });
        });
    }

    async copyAsset(url: string, destPath?: string): Promise<string> {
        let realUrl = await this.getAssetsUrl(url);
        return FileUtils.copy(realUrl, destPath);
    }
}

export const resMgr: ResMgr = new ResMgr();