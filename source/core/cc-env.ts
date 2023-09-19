import {native as n} from 'cc';

const jsb = (window as any).jsb;

export const native = n ?? jsb;