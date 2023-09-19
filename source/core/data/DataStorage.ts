import {sys} from 'cc';

function replacer(this: any, key: string, value: any) {
    const originalObject = this[key];
    if (originalObject instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(originalObject.entries()),
        };
    }
    if (originalObject instanceof Set) {
        return {
            dataType: 'Set',
            value: Array.from(originalObject.entries()),
        };
    }
    return value;
}

function reviver(this: any, key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Set') {
            return new Set(value.value);
        }
    }
    return value;
}


export {replacer as json_replacer, reviver as json_reviver}

export class DataStorage {
    static readData(fileKey: string) {
        let s = sys.localStorage.getItem(fileKey);
        if (null != s && '' != s) {
            return JSON.parse(s, reviver);
        }
        return null;
    }

    static saveData(fileKey: string, value: object) {
        sys.localStorage.setItem(fileKey, JSON.stringify(value, replacer))
    }

    static clearData(fileKey: string) {
        sys.localStorage.removeItem(fileKey);
    }
}