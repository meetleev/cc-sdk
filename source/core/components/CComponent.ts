import {director, ISchedulable, macro, Scheduler} from 'cc';
import {CNode} from "./CNode";

const scheduler = director.getScheduler();

export class CComponent implements ISchedulable {
    private _node: CNode;

    get node(): CNode {
        return this._node;
    }

    set node(value: CNode) {
        this._node = value;
    }

    onLoad() {
        Scheduler.enableForTarget(this);
        const paused = scheduler.isTargetPaused(this);
        scheduler.schedule(this.update, this, 0, macro.REPEAT_FOREVER, 0, paused);
    }

    destroy() {
        this.onDestroy();
        scheduler.unschedule(this.update, this);
    }

    protected onDestroy() {
    }

    protected update(dt: number) {

    }
}