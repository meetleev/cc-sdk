import {TimeSchedule} from "./components";
import {resMgr} from "./ResMgr";

const MusicEnabled: string = 'ccx@MusicEnabled';
const EffectEnabled: string = 'ccx@EffectEnabled';

enum AudioType {
    BGMusic,
    Music,
    Effect
}

export class AudioMgr {
    private static instance?: AudioMgr;
    private commonAudioSources: cc.AudioSource[] = [];

    private musicAudioSourceMap: Map<string, cc.AudioSource> = new Map<string, cc.AudioSource>();
    private readonly bgAudioSource: cc.AudioSource;
    private maxCommonAudioNums = 10;
    private _musicEnabled: boolean = false;

    get musicEnabled(): boolean {
        return this._musicEnabled;
    }

    set musicEnabled(value: boolean) {
        if (this._musicEnabled != value) {
            this._musicEnabled = value;
            if (value) {
                this.resumeAllMusic();
            } else {
                this.pauseAllMusic();
            }
            cc.sys.localStorage.setItem(MusicEnabled, this._musicEnabled ? '1' : '0');
        }
    }

    private _effectEnabled: boolean = false;

    get effectEnabled(): boolean {
        return this._effectEnabled;
    }

    set effectEnabled(value: boolean) {
        if (this._effectEnabled != value) {
            this._effectEnabled = value;
            cc.sys.localStorage.setItem(EffectEnabled, this._effectEnabled ? '1' : '0');
        }
    }

    private _adPlaying: boolean = false;

    get adPlaying(): boolean {
        return this._adPlaying;
    }

    set adPlaying(value: boolean) {
        if (this._adPlaying != value) {
            this._adPlaying = value;
            this._adPlaying ? this.pauseAllMusic() : this.resumeAllMusic();
        }
    }

    private readonly _audioNodeRoot: cc.Node;

    private _timeSchedule: TimeSchedule;

    static get Instance() {
        if (null == AudioMgr.instance)
            AudioMgr.instance = new AudioMgr();
        return AudioMgr.instance;
    }

    private constructor() {
        cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
            delete AudioMgr.instance;
            AudioMgr.instance = undefined;
        });
        this._audioNodeRoot = new cc.Node('audio');
        cc.director.getScene()?.addChild(this._audioNodeRoot);

        this._timeSchedule = this._audioNodeRoot.addComponent(TimeSchedule);

        for (let i = 0; i < this.maxCommonAudioNums; i++) {
            this.commonAudioSources.push(this.createAudio());
        }

        this.bgAudioSource = this.createAudio(true);

        let enabled = cc.sys.localStorage.getItem(MusicEnabled);
        this._musicEnabled = '0' != enabled;
        enabled = cc.sys.localStorage.getItem(EffectEnabled);
        this._effectEnabled = '0' != enabled;
    }

    playBGMusic(audioClip: string | cc.AudioClip, loop: boolean = true, volume: number = 1) {
        if (audioClip instanceof cc.AudioClip) {
            this.play(AudioType.BGMusic, audioClip, volume, loop);
        } else {
            AudioMgr.loadAudio(audioClip).then((clip: cc.AudioClip) => {
                this.play(AudioType.BGMusic, clip, volume, loop);
            });
        }
    }

    playMusic(audioClip: string | cc.AudioClip, loop: boolean = true, volume: number = 1) {
        if (audioClip instanceof cc.AudioClip) {
            this.play(AudioType.Music, audioClip, volume, loop);
        } else {
            AudioMgr.loadAudio(audioClip).then((clip: cc.AudioClip) => {
                this.play(AudioType.Music, clip, volume, loop);
            });
        }
    }

    playEffect(audioClip: string | cc.AudioClip, volume: number = 1) {
        if (audioClip instanceof cc.AudioClip) {
            this.play(AudioType.Effect, audioClip, volume);
        } else {
            AudioMgr.loadAudio(audioClip).then((clip: cc.AudioClip) => {
                this.play(AudioType.Effect, clip, volume);
            });
        }
    }

    pauseAllMusic() {
        this.bgAudioSource?.stop();
        let audioSources = Array.from(this.musicAudioSourceMap.values());
        audioSources.forEach((o) => o.stop());
    }

    pauseMusic(audioClip: string, bFadeOut?: boolean) {
        let audio: cc.AudioSource;
        if (this.bgAudioSource) {
            if (this.bgAudioSource.clip?.name == audioClip) {
                audio = this.bgAudioSource;
            }
        }
        audio = this.musicAudioSourceMap.get(audioClip) as cc.AudioSource;
        if (audio) {
            if (bFadeOut) {
                let orgVolume = audio.volume;
                this._timeSchedule.schedule(
                    (dt: number) => {
                        audio.volume -= dt;
                        if (audio.volume <= 0.1) {
                            audio.stop();
                            audio.volume = orgVolume;
                            return true;
                        }
                        return false;
                    }
                );
            } else audio.stop();
        }
    }

    resumeBGMusic() {
        if (this._musicEnabled)
            this.bgAudioSource?.play();
    }

    resumeAllMusic() {
        if (this._musicEnabled) {
            this.bgAudioSource?.play();
            let audioSources = Array.from(this.musicAudioSourceMap.values());
            audioSources.forEach((o) => o.play());
        }
    }

    destroyMusic(audioClip: string) {
        if (this.bgAudioSource) {
            if (this.bgAudioSource.clip?.name == audioClip) {
                this.bgAudioSource.stop();
                this.bgAudioSource.clip.destroy();
                this.bgAudioSource.clip = null;
            }
        }
        if (this.musicAudioSourceMap.has(audioClip)) {
            let audio = this.musicAudioSourceMap.get(audioClip);
            audio?.stop();
            audio?.destroy();
            this.musicAudioSourceMap.delete(audioClip);
        }
    }

    destroyMusicExceptBg() {
        let audioSources = Array.from(this.musicAudioSourceMap.values());
        audioSources.forEach((o) => o.destroy());
        this.musicAudioSourceMap.clear();
    }

    private play(audioType: AudioType, pAudioClip: cc.AudioClip, volume: number, loop?: boolean) {
        switch (audioType) {
            case AudioType.BGMusic: {
                if (!this.adPlaying && this._musicEnabled) {
                    this.bgAudioSource.stop();
                    this.bgAudioSource.clip = pAudioClip;
                    loop && (this.bgAudioSource.loop = loop);
                    this.bgAudioSource.volume = volume;
                    this.bgAudioSource.playOnLoad = true;
                    this.bgAudioSource.play();
                } else {
                    this.bgAudioSource.clip = pAudioClip;
                    this.bgAudioSource.stop();
                }
                break;
            }
            case AudioType.Music: {
                let musicAudioSource: cc.AudioSource;
                if (!this.musicAudioSourceMap.has(pAudioClip.name)) {
                    musicAudioSource = this.createAudio(loop);
                    musicAudioSource.clip = pAudioClip;
                    this.musicAudioSourceMap.set(pAudioClip.name, musicAudioSource);
                } else musicAudioSource = this.musicAudioSourceMap.get(pAudioClip.name) as cc.AudioSource;
                if (!this.adPlaying && this._musicEnabled) {
                    musicAudioSource.volume = volume;
                    musicAudioSource.playOnLoad = true;
                    musicAudioSource.play();
                } else musicAudioSource?.stop();
                break;
            }
            case AudioType.Effect: {
                if (!this.adPlaying && this._effectEnabled) {
                    let effectAudioSource = this.getFreeCommonAudioSource();
                    effectAudioSource.clip = pAudioClip;
                    effectAudioSource.volume = volume;
                    effectAudioSource.play();
                }
                break;
            }
        }
    }

    private getFreeCommonAudioSource() {
        for (let i = 0, len = this.commonAudioSources.length; i < len; i++) {
            let audioSource = this.commonAudioSources[i];
            if (!audioSource.isPlaying)
                return audioSource;
        }
        let audioSource = this.createAudio();
        this.commonAudioSources.push(audioSource);
        return audioSource;
    }

    private createAudio(loop?: boolean) {
        let audioSource = this._audioNodeRoot.addComponent(cc.AudioSource);
        loop && (audioSource.loop = loop);
        audioSource.volume = 1;
        audioSource.playOnLoad = false;
        return audioSource;
    }

    private static loadAudio(audioPath: string) {
        return resMgr.loadAudio(audioPath);
    }
}