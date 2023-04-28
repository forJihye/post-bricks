import axios from "axios";
import { createCounter } from "./utils";

const createParams = (params: HashsnapPostParams) => Object.keys(params).map((key) => `${key}=${(params as any)[key]}`).join('&');

class PostUtils {
  static checkImage(src: string) { 
    return new Promise(res => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = src + `?not-from-cache`;
      img.onload = () => res(img);
      img.onerror = () => res(null);
    })
  }
  static checkVideo(src: string) { 
    return new Promise(res => {
      const video = document.createElement('video') as HTMLVideoElement
      video.src = src;
      video.muted = true;
      video.loop = false;
      video.oncanplay = () => res(video);
      video.onerror = () => res(null);
    })
  }
  static async checkPosts(posts: HashsnapPostItem[]) {
    const checking = posts.map(async (post) => {
      switch(post.type) {
      case 'image': return await this.checkImage(post.url)
      case 'video': return await this.checkVideo(post.url);
      }
    });
    const checked = await Promise.all([...checking]);
    return posts.filter((_, i) => checked[i]);
  }
}

/** 해시스냅 포스트 일반 로더 */
class PostLoader {
  page: number = 1; // 포스트 페이지 
  length!: number; // 초기 로딩 개수
  moreLength!: number; // 더보기 로딩 개수
  maxPage!: number; // 최대 페이지 개수
  projectUid: string = ''; // 프로젝트 UID
  options: HashsnapPostParams = {}; // API 파라미터
  store: HashsnapPostItem[] = []; // 포스트 저장소

  isLoading: boolean = false; 
  isInited: boolean = false;
  isRunout: boolean = false;
  onRunout!: () => void;
  constructor(projectUid: string, { options, onRunout }: ({options:HashsnapPostParams; onRunout?:()=>void})) {
    Object.assign(this, {
      projectUid,
      options: {...options, page: this.page },
      onRunout,
    });
  }
  get _currentLength() {
    return !this.isInited ? this.length : this.moreLength;
  }
  get _currentPage() {
    return this.page;
  }
  init(length: number, maxPage: number) {
    Object.assign(this, { length, moreLength: length, maxPage });
  }
  private async checkedPost(options: HashsnapPostParams){
    const { data: {items} } = await axios.get(`https://api.hashsnap.net/posts/${this.projectUid}?${createParams(options)}`) as {data: HashsnapPost};
    const liveItems = items.filter(({deleted}) => !deleted);
    return liveItems; // return await PostUtils.checkPosts(liveItems);
  }
  private counter() {
    return createCounter(3, () => typeof this.onRunout === 'function' && this.onRunout() || (this.isRunout = true));
  } 
  async load(page?: number): Promise<HashsnapPostItem[]> {
    if (this.isRunout) return []
    if (this.isLoading) return []
    if (this.store.length >= this._currentLength) return this.store.splice(0, this._currentLength);
    this.isLoading = true;
    
    if (page) this.page = page;

    try {
      while(true) {
        // console.log(0)
        const completed = await this.checkedPost({...this.options, page: this.page, limit: this._currentLength});
        if (completed.length === 0) {
          if (typeof this.onRunout === 'function') this.counter();
          else break;
        }
        // console.log(1)
        this.store.push(...completed);
        if (!page) (this.page += 1);
        if (this.store.length >= this._currentLength) break;
        if (this.isRunout) break;
        if (this.page >= this.maxPage) break;
        // console.log(2)
      }
      !this.isInited && (this.isInited = true);
      this.isLoading = false;
      
      return this.store.splice(0, this._currentLength);
    } catch(err) {
      this.isLoading = false;
      console.error(err);
      return [];
    }
  }
}

/** (미사용) 해시스냅 포스트 페이징 로더 */
class PostPageLoader {
  page: number = 1;
  limit!: number;
  totalPosts: number = 0;
  projectUid: string = '';
  options: HashsnapPostParams = {};
  remained: HashsnapPostItem[] = [];
  isLoading: boolean = false;
  isInited!: Promise<any>;
  isRunout: boolean = false;
  onRunout!: () => void;
  constructor({ projectUid, limit, options, onRunout }: ({projectUid:string;limit:number;options:HashsnapPostParams;onRunout?:()=>void})) {
    const initOptions = { ...options, limit, page: this.page };
    Object.assign(this, {
      projectUid,
      limit,
      options: initOptions,
      postURL: `https://api.hashsnap.net/posts/${projectUid}?${createParams(initOptions)}`,
      onRunout,
    });
    this.isInited = this.init();
  }
  private async init() {
    const { data } = await axios.get(`https://api.hashsnap.net/projects/${this.projectUid}`);
    const stats = data.stats as HashsnapProjectStats;
    return (stats.posts_count - stats.deleted_posts_count);
  }
  private async checkedPost(){
    const { data: {items} } = await axios.get(`https://api.hashsnap.net/posts/${this.projectUid}?${createParams({...this.options, page: this.page})}`) as {data: HashsnapPost};
    const liveItems = items.filter(({deleted}) => !deleted);
    return liveItems;
    // return await PostUtils.checkPosts(liveItems);
  }
  async load(page: number) {
    if (this.isRunout) return [];
    if (this.isLoading) return [];
    if (this.remained.length >= this.limit) return this.remained.splice(0, this.limit);
    this.isLoading = true;

    try {
      this.page = page;
      const completed = await this.checkedPost();
      if (completed.length === 0) return [];
      this.remained.push(...completed);
      this.isLoading = false
      return this.remained.splice(0, this.limit);
    } catch(err) {
      console.error(err);
      this.isLoading = false;
      return [];
    }
  }
}

export {
  PostLoader,
  PostPageLoader,
  PostUtils
};
