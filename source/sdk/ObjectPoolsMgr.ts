import {Log} from "../Log";

export type ObjectType = number;

export class ObjectPoolsMgr {
    private _nodePoolMap: Map<ObjectType, cc.NodePool> = new Map<ObjectType, cc.NodePool>();
    private static instance: ObjectPoolsMgr;

    static get Instance() {
        if (null == ObjectPoolsMgr.instance)
            ObjectPoolsMgr.instance = new ObjectPoolsMgr();
        return ObjectPoolsMgr.instance;
    }

    private constructor() {
    }

    getObjectFromPool(objectType: ObjectType) {
        if (this._nodePoolMap.has(objectType)) {
            let nodePool = this._nodePoolMap.get(objectType);
            if (nodePool) {
                let node = nodePool.get();
                if (0 == nodePool.size()) {
                    Log.l('pool get out', objectType);
                    node && nodePool.put(cc.instantiate(node));
                }
                return node;
            }
            return this._nodePoolMap.get(objectType)?.get();
        }
        return null;
    }

    initObjectToPool(objectType: ObjectType, obj: cc.Node | cc.Prefab, count: number) {
        for (let i = 0; i < count; i++)
            this.putObjectToPool(objectType, cc.instantiate(obj) as cc.Node);
    }

    putObjectToPool(objectType: ObjectType, obj: cc.Node) {
        let nodePool: cc.NodePool;
        if (!this._nodePoolMap.has(objectType)) {
            nodePool = new cc.NodePool();
            this._nodePoolMap.set(objectType, nodePool);
        } else {
            nodePool = this._nodePoolMap.get(objectType) as cc.NodePool;
        }
        obj && nodePool?.put(obj);
    }

    clearObjectPool(objectType: ObjectType) {
        if (this._nodePoolMap.has(objectType))
            this._nodePoolMap.get(objectType)?.clear();
    }
}