import {Canvas, Director, director, instantiate, Node, Size, UITransform, view} from "cc";
import {resMgr} from "./ResMgr";

export type UIType = number;

export interface IUIRes {
    uiType: UIType;
    uiResFilePath: string | Node,
}

export class UIMgr {
    private uiTypeNodeMap: Map<UIType, Node> = new Map<UIType, Node>();
    private uiTypes: Set<UIType> = new Set<UIType>();
    private static instance?: UIMgr;
    static defaultPanelZOrder: number = 1000;

    static get Instance() {
        if (undefined == UIMgr.instance)
            UIMgr.instance = new UIMgr();
        return UIMgr.instance;
    }

    private constructor() {
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
            this.uiRoot = undefined;
            this._canvas = undefined;
            this.uiTypes.clear();
            this.uiTypeNodeMap.clear();
        });
    }

    uiRoot?: Node;

    private _canvas?: Node;

    get canvas() {
        if (undefined != this._canvas) return this._canvas;
        let scene = director.getScene();
        if (scene) {
            let children = scene.children;
            for (let i = 0, len = children.length; i < len; i++) {
                let child: Node = children[i] as Node;
                let canvas = child.getComponent(Canvas);
                if (canvas) {
                    this._canvas = canvas.node;
                    return child;
                }
            }
        }
        return null;
    }

    private _winSize: Size = Size.ZERO;

    get winSize() {
        if (this._winSize.equals(Size.ZERO))
            this._winSize = view.getVisibleSize();
        return this._winSize;
    }

    private async createUI(uiType: UIType, uiResFilePath: string): Promise<Node> {
        let prefab = await resMgr.loadPrefab(uiResFilePath);
        let pNode: Node = instantiate(prefab);
        let parent = undefined != this.uiRoot ? this.uiRoot : this.canvas;
        parent!.addChild(pNode);
        let ut = pNode.getComponent(UITransform)
        if (null == ut)
            ut = pNode.addComponent(UITransform);
        ut.contentSize = view.getVisibleSize();
        this.uiTypeNodeMap.set(uiType, pNode);
        return pNode;
    }

    getNode(uiType: UIType): Node | undefined {
        return this.uiTypeNodeMap.get(uiType);
    }

    async preload(uiNodes: IUIRes[]) {
        for (let o of uiNodes) {
            let uiType = o.uiType;
            let uiResFilePath = o.uiResFilePath;
            if (!this.uiTypes.has(uiType)) {
                this.uiTypes.add(uiType);
                let pNode: Node | undefined;
                if ('string' == typeof uiResFilePath) {
                    pNode = await this.createUI(uiType, uiResFilePath);
                } else {
                    this.uiTypeNodeMap.set(uiType, uiResFilePath);
                    pNode = uiResFilePath;
                }
                pNode.active = false;
            }
        }
    }

    async show(uiType: UIType, uiResFilePath?: string | Node, zOrder?: number): Promise<Node | undefined> {
        let pNode: Node | undefined;
        if (!this.uiTypes.has(uiType)) {
            if (undefined != uiResFilePath) {
                this.uiTypes.add(uiType);
                if ('string' == typeof uiResFilePath)
                    pNode = await this.createUI(uiType, uiResFilePath);
                else {
                    this.uiTypeNodeMap.set(uiType, uiResFilePath);
                    pNode = uiResFilePath;
                }
            }
        } else {
            pNode = this.getNode(uiType);
        }
        if (undefined != pNode) {
            pNode.setSiblingIndex(zOrder ?? (UIMgr.defaultPanelZOrder + this.uiTypeNodeMap.size));
            pNode.active = true;
        }
        return pNode;
    }

    hide(uiType: UIType) {
        let pNode = this.getNode(uiType);
        if (undefined != pNode)
            pNode.active = false;
    }
}