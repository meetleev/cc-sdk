import {Node, Component} from 'cc';
import {CComponent} from "./CComponent";
import {Log} from "../../Log";

export type _Constructor<T = unknown> = new (...args: any[]) => T;

export class CNode {
    private readonly _cComponents: CComponent[] = [];
    private readonly _node: Node;

    get node(): Node {
        return this._node;
    }

    constructor(name?: string) {
        Log.l('CNode ctor');
        this._node = new Node(name);
        this._node.on(Node.EventType.NODE_DESTROYED, this._onDestroy, this)
    }

    addComponent<T extends Component>(classConstructor: _Constructor<T>): T {
        return this._node.addComponent(classConstructor);
    }

    getComponent<T extends Component>(classConstructor: _Constructor<T>): T | null {
        return this._node.getComponent(classConstructor);
    }

    addCComponent<T extends CComponent>(classConstructor: _Constructor<T>): T {
        let comp = this.getCComponent(classConstructor);
        if (null != comp) return comp;
        comp = new classConstructor();
        comp.node = this;
        comp.onLoad();
        this._cComponents.push(comp);
        return comp;
    }

    getCComponent<T extends CComponent>(classConstructor: _Constructor<T>): T | null {
        for (let c of this._cComponents)
            if (c.constructor == classConstructor)
                return T(c);
        return null;
    }

    removeCComponent<T extends CComponent>(classConstructor: _Constructor<T>) {
        for (let i, l = this._cComponents.length; i < l; i++) {
            let c = this._cComponents[i];
            if (c.constructor == classConstructor) {
                this._cComponents.splice(i, 1);
                c.destroy();
            }
        }
    }

    removeAllCComponent() {
        for (let c of this._cComponents)
            c.destroy();
        this._cComponents.length = 0;
    }

    private _onDestroy() {
        Log.l('CNode _onDestroy', this._node._id);
        this._node.off(Node.EventType.NODE_DESTROYED, this._onDestroy, this)
        this.removeAllCComponent();
    }

    destroy() {
        this._node.destroy();
    }
}