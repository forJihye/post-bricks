import './style.css';
import { PostLoader } from './post-loader';
import useCreatePostEls from './create-post';
import ColumnRenderer from './column-renderer';
import Pagination from './pagination';
import { Carousel } from './carousel';
import { debounce, findTarget, getMaxZIndex, insertChild } from './utils';
import axios from 'axios';
/**
 * 임베드 방식
 * 1. 커스텀 엘리먼트 구조 + 스크립트
 *  장점: 엘리먼트 트리 구조 자유롭게 변경 가능
 *  단점: 코드가 길다, 엘리먼트가 많아서 헷갈린다.
 * 2. 스크립트 (라이브러리 형식)
 *  장점: 타 라이브버리 사용처럼 객체 키의 값을 옵션으로 사용
 *  단점: 자유로운 엘리먼트 구조 변경 불가, 적용된 레이아웃 한에서 사용 가능
 * 3. 커스텀 엘리먼트 + 라이브러리 형식 (옵션 설정)
 * 
 */

/**
 * 인스턴스
 * 1. 포스트 데이터 불러오기
 * 2. 포스트 데이터 + 엘리먼트 렌더링
 * 3. 컬럼 랜더링
 * 4. 포스트 로딩 
 */

export const $ = document.querySelector.bind(document);
export const $$ = document.querySelectorAll.bind(document);

export const getStructureNode = (structure: string): Element => {
  const node = $(`[data-element="${structure}"]`);
  node && node.removeAttribute("data-element");
  return node as Element ;
}

export const projectInit = async (projectUid: string): Promise<number> => {
  const { data: {stats} } = await axios.get(`https://api.hashsnap.net/projects/${projectUid}`) as {data: {stats : HashsnapProjectStats}};
  const totalCount = stats.posts_count - stats.deleted_posts_count
  return totalCount;
}

const getFocusTarget = (conditionCallback: Function, f: (target: HTMLElement) => void) => (ev: MouseEvent) => (el => el && f(el))(findTarget(bricksInner, conditionCallback)(ev));

// const rootDiv = $('#app')  as Element;
const hsViewDiv = $('hashsnap-view') as Element;
const bricksRoot = Object.assign(document.createElement('div'), {id: 'hs-bricks-app'});
const bricksInner = Object.assign(document.createElement('div'), {className: 'hs-bricks-inner'});
const popupRootDiv = insertChild(document.body, Object.assign(document.createElement('div'), {id: 'hs-bricks-popup', style: `z-index:${getMaxZIndex() + 1}`}));
const moreParent: HTMLElement = Object.assign(document.createElement('div'), {id: 'post-more-parent'})

const storeMap: Map<HTMLElement, HashsnapPostItem> = new Map();
const PROJECT_UID =  "512e2868-f49d-41eb-8686-da8513825d00" // "3eef7855-4336-4aab-8d6b-b1291e5f2902" //;
const defaultLayout = {
  desktop: { columns: 4, rows: 2, },
  tablet: { columns: 3, rows: 2, },
  mobile: { columns: 2, rows: 2 }
}
  
const main = async () => { try {
  const totalPost = await projectInit(PROJECT_UID);
  const viewName = hsViewDiv.getAttribute('name') as string;
  bricksRoot.setAttribute('name', viewName);
  bricksRoot.appendChild(bricksInner);
  bricksRoot.appendChild(moreParent);

  const postStructure = getStructureNode('post');
  const popupStructure = getStructureNode('popup');
  const createPostEls = useCreatePostEls(postStructure);
  const createPopupEls = useCreatePostEls(popupStructure);
  // 포스트 엘리먼트 생성 및 렌더링 함수
  const createdPostEls = (posts: HashsnapPostItem[]): HTMLElement[] => posts.map((post) => {
    const el = createPostEls(post);
    storeMap.set(el, post);
    return el;
  });

  // 포스트 팝업
  bricksInner.onclick = getFocusTarget((el: any) => storeMap.has(el), (el) => {
    const post = storeMap.get(el) as HashsnapPostItem;
    const popupEl = createPopupEls(post);
    popupRootDiv.appendChild(popupEl);
  });
  
  hsViewDiv.parentElement?.replaceChildren(bricksRoot); 
  
  class BricksView {
    target!: Element; // <hashsnap-view>
    
    postLoader!: PostLoader;
    columnRenderer!: ColumnRenderer;

    pagination!: Pagination;
    carousel!: Carousel;
    
    layout!: any; // 디바이스 별 레이아웃
    postOptions!: any; // 포스트 관련 옵션
    viewOptions!: any; // 뷰 관련 옵션

    method: ('button'|'pagination'|'carousel') = 'button';
    columns!: number;
    postLength: number = 0;
    maxLength!: number;

    isInited: boolean = false;
    constructor(
      target: Element, { 
        projectUid, 
        layout = defaultLayout,
        postOptions,
        viewOptions,
      }: any
    ) {
      Object.assign(this, { target, projectUid, layout, postOptions, viewOptions });
      this.breakpoint(window.innerWidth);
      this.postLoader = new PostLoader(projectUid, { options: {...postOptions} });
      this.columnRenderer = new ColumnRenderer(bricksInner);
      this.carousel = new Carousel(bricksInner);
      this.pagination = new Pagination(moreParent);
      this.method = viewOptions.method;

      this.init();

      window.addEventListener('resize', debounce(ev => {
        const innerWidth = ev.target.innerWidth;
        this.breakpoint(innerWidth);
        // this.init();
        this.columnRenderer.resize(this.columns, [...storeMap.keys()]);
      }, 100));
    }
    init() {
      const maxPageNum = Math.round(totalPost / (this.postLength));
      console.log(totalPost, this.postLength, maxPageNum);
      this.maxLength = maxPageNum;
      this.postLoader.init(this.postLength, maxPageNum);
      this.columnRenderer.init(this.columns);
      this.pagination.init(maxPageNum);
      this.carousel.init(this.columns, maxPageNum);
      !this.isInited && this.render(this.method);
      if (!this.isInited) this.isInited = true
    }
    breakpoint(parentWidth: number) {
      if (parentWidth < 767) { // 모바일
        const {columns, rows} = this.layout['mobile'];
        this.postLength = columns * rows;
        this.columns = columns;
      } 
      else if (parentWidth > 768 && parentWidth < 1023) { // 태블릿
        const {columns, rows} = this.layout['tablet'];
        this.postLength = columns * rows;
        this.columns = columns;
      } 
      else { // 데스크탑 if (parentWidth > 1024)
        const {columns, rows} = this.layout['desktop'];
        this.postLength = columns * rows;
        this.columns = columns;
      } 
      return this.columns;
    }
    postsNode(posts: HashsnapPostItem[], hook?: (payload: any) => void) {
      const nodes = createdPostEls(posts);
      hook && hook(nodes);
      return nodes;
    }
    async postAppend(): Promise<HTMLElement[]> { // 포스트 추가
      const posts = await this.postLoader.load() as HashsnapPostItem[]
      if (!posts.length) return [];
      const postEls = this.postsNode(posts);
      this.columnRenderer.render(postEls);
      return postEls;
    }
    async pagePostAppend(pageNum: number): Promise<HTMLElement[]> { // 포스트 추가
      const posts = await this.postLoader.load(pageNum) as HashsnapPostItem[]
      if (!posts.length) return [];
      const postEls = this.postsNode(posts);
      this.columnRenderer.render(postEls);
      return postEls;
    }
    async render(method: ('button'|'pagination'|'carousel')) {
      this.method = method;
      switch(method) {
      case 'button': {
        await this.postAppend();
        const button = Object.assign(document.createElement('button'), {
          id: 'post-more', 
          innerText: 'more',
          onclick: async () => await this.postAppend(),
        });
        moreParent.appendChild(button);
      }
      break;
      case 'pagination': {
        await this.pagePostAppend(this.pagination.page);
        this.pagination.render();
        this.pagination.hook = async (pageNum: number) => {
          storeMap.clear();
          this.columnRenderer.remove();
          await this.pagePostAppend(pageNum);
        }
        bricksRoot.appendChild(this.pagination.root);
      }
      break;
      case 'carousel': {
        this.carousel.init(this.columns, Math.round(totalPost / (this.postLength)));
        // 클래스 columnRenderer 에서 storeMap에 현재와 다음요소가 같이 저장되어있어서 리사이징 할 때 다음 요소까지 같이 그려지는 문제 발생
        // const initPosts = await this.pagePostAppend(1);
        // const newPosts = await this.pagePostAppend(2);
        // this.carousel.initItem(initPosts, newPosts);
        // this.carousel.next = async (pageNum: number) => {
        //   return await this.pagePostAppend(pageNum) as HTMLElement[];
        // }
      }
      break;
      }
    }
  }
  
  new BricksView(hsViewDiv, {
    projectUid: PROJECT_UID, 
    postOptions: {},
    viewOptions: {
      method: 'carousel'
    },
  });

} catch(err) {
  console.error(err);
}}

main();  

// (window as any).hashsnapView = function(root: HTMLElement, options: any) {
//   'use strict';
// }

