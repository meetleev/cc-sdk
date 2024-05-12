import {sys} from 'cc';
import {native} from "../cc-env";

export class FileUtils {
    static extractFileName(url: string): string | null {
        // 使用正则表达式从 URL 中提取文件名
        const match = url.match(/\/([^/]+)$/);
        if (match) {
            let fileNameWithExtension = match[1]; // 包含扩展名的文件名
            // 去除扩展名
            const index = fileNameWithExtension.lastIndexOf('.');
            if (index !== -1) {
                return fileNameWithExtension.substring(0, index); // 不包含扩展名的文件名
            } else {
                return fileNameWithExtension; // 如果没有扩展名，则返回原始文件名
            }
        }
        return null; // 如果 URL 格式不正确，则返回 null
    }

    static copy(src: string, dest?: string): string {
        if (sys.isNative) {
            const writablePath = native.fileUtils.getWritablePath();
            dest ??= writablePath + FileUtils.extractFileName(src) + '.tmp';
            let data = native.fileUtils.getDataFromFile(src);
            native.fileUtils.writeDataToFile(data, dest);
        }
        return dest ?? src;
    }
}