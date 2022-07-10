class ResMgr {
    private resHash: Map<string, cc.Asset> = new Map<string, cc.Asset>();

    constructor() {
        this.resHash.clear();
    }

    /**
     * Load the tiledMapAsset asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the tiledMapAsset (${project}/assets/resources/tiledMaps/map.tmx) from resources
     * ccx.resMgr.loadTiledMap('map').then( (texture) => console.log(texture) ).catch( (err) => console.log(err) );
     */
    loadTiledMap(paths: string, topDir?: string): Promise<cc.TiledMapAsset> {
        topDir ??= 'tiledMaps';
        return this.load(cc.TiledMapAsset, `${topDir}/${paths}`);
    }

    /**
     * Load the audioClip asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the audioClip (${project}/assets/resources/audios/audio.mp3) from resources
     * ccx.resMgr.loadAudio('audio').then( (audioClip) => console.log(audioClip) ).catch( (err) => console.log(err) );
     */
    loadAudio(paths: string, topDir?: string): Promise<cc.AudioClip> {
        topDir ??= 'audios';
        return this.load(cc.AudioClip, `${topDir}/${paths}`);
    }

    /**
     * Load the prefab asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the prefab (${project}/assets/resources/prefabs/ui.prefab) from resources
     * ccx.resMgr.loadPrefab('ui').then( (prefab) => console.log(prefab) ).catch( (err) => console.log(err) );
     */
    loadPrefab(paths: string, topDir?: string): Promise<cc.Prefab> {
        topDir ??= 'prefabs';
        return this.load(cc.Prefab, `${topDir}/${paths}`);
    }

    /**
     * Load the texture2D asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the texture2D (${project}/assets/resources/textures/bg.png) from resources
     * ccx.resMgr.loadTexture('bg').then( (texture2D) => console.log(texture2D) ).catch( (err) => console.log(err) );
     */
    loadTexture(paths: string, topDir?: string): Promise<cc.Texture2D> {
        topDir ??= 'textures';
        return this.load(cc.Texture2D, `${topDir}/${paths}`);
    }

    /**
     * Load the spriteFrame asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the spriteFrame (${project}/assets/resources/textures/bg.png) from resources
     * ccx.resMgr.loadSpriteFrame('bg').then( (spriteFrame) => console.log(spriteFrame) ).catch( (err) => console.log(err) );
     */
    loadSpriteFrame(paths: string, topDir?: string): Promise<cc.SpriteFrame> {
        topDir ??= 'textures';
        return this.load(cc.SpriteFrame, `${topDir}/${paths}`);
    }

    /**
     * Load the material asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the material (${project}/assets/resources/materials/bg.mat) from resources
     * ccx.resMgr.loadMaterial('bg').then( (material) => console.log(material) ).catch( (err) => console.log(err) );
     */
    loadMaterial(paths: string, topDir?: string): Promise<cc.Material> {
        topDir ??= 'materials';
        return this.load(cc.Material, `${topDir}/${paths}`);
    }

    /**
     * Load the spine asset within this bundle by the path which is relative to bundle's path
     *
     * @param {String} paths
     * @param {String} topDir
     * @api public
     * @example
     * // load the spine (${project}/assets/resources/spines/bg.json) from resources
     * ccx.resMgr.loadSkeletonData('bg').then( (spine) => console.log(spine) ).catch( (err) => console.log(err) );
     */
    loadSkeletonData(paths: string, topDir?: string): Promise<sp.SkeletonData> {
        return new Promise((resolve, reject) => {
            topDir ??= 'spines';
            cc.resources.load(`${topDir}/${paths}`, sp.SkeletonData, (err, skeleton: sp.SkeletonData) => {
                err && console.log('loadSpine err ', err, `spines/${paths}`);
                if (err) reject(err); else resolve(skeleton);
            });
        });
    }

    /**
     * Load the asset within this bundle by the path which is relative to bundle's path
     *
     * @param {Asset} type
     * @param {String} paths
     * @param {boolean} bLogError
     * @api public
     * @example
     * // load the material (${project}/assets/resources/texture2D/bg.png) from resources
     * ccx.resMgr.load(Texture2D, 'texture2D/bg').then( (texture) => console.log(texture) ).catch( (err) => console.log(err) );
     */
    load<T extends cc.Asset>(type: typeof cc.Asset, paths: string, bLogError: boolean = false): Promise<T> {
        return new Promise((resolve, reject) => {
            let res = this.resHash.get(paths);
            undefined !== res ? resolve(res as T) : cc.resources.load(paths, type, (err: Error | null, assets: T) => {
                if (!err) {
                    this.resHash.set(assets.name, assets);
                    resolve(assets);
                } else {
                    !bLogError && console.log('load err ', err, `type = ${type} paths = ${paths}`);
                    reject(err);
                }
            });
        });
    }
}

export const resMgr: ResMgr = new ResMgr();