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
const postColumnsParent = Object.assign(document.createElement('div'), {className: "post-columns-main"})
const popupRootDiv = insertChild(document.body, Object.assign(document.createElement('div'), {id: 'hs-bricks-popup', style: `z-index:${getMaxZIndex() + 1}`}));
const morePostUIParent = Object.assign(document.createElement('div'), {id: 'post-more-parent'});

const defaultLayout = {
  desktop: {
    columns: 4,
    rows: 2,
  },
  tablet: {
    columns: 3,
    rows: 2,
  },
  mobile: {
    columns: 2,
    rows: 2,
  }
}
const columns = 4;
const rows = 2;
const storeMap: Map<HTMLElement, HashsnapPostItem> = new Map();

// const PROJECT_UID = 'cfa7a982-233c-4748-a825-d8f69fc93ac2';
const PROJECT_UID =  "512e2868-f49d-41eb-8686-da8513825d00" // "3eef7855-4336-4aab-8d6b-b1291e5f2902" //;
const moreUI: string = "button";
// const moreUI: string = "pagination";
// const moreUI: string = "carousel";
  
const main = async () => { try {
  const totalPost = await projectInit(PROJECT_UID);
  const viewName = hsViewDiv.getAttribute('name') as string;
  bricksRoot.setAttribute('name', viewName);
  bricksRoot.appendChild(bricksInner);
  bricksRoot.appendChild(morePostUIParent);

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


  // 기본 포스트 엘리먼트 컬럼 렌더링
  const postElsRender = async (page?: number, hook?: () => void) => {
    const posts = await postLoader.load();
    const postsEls = createdPostEls(posts);
    hook && hook();
    return postsEls;
  }
  const postLoader = new PostLoader(PROJECT_UID, { options: {} });
  const pagination = new Pagination(morePostUIParent);
  const columnRenderer = new ColumnRenderer(bricksInner);
  postLoader.init(columns * rows, Math.ceil(totalPost / (columns*rows)));
  pagination.init(Math.ceil(totalPost / (columns*rows)))
  columnRenderer.init(postColumnsParent, columns);
  console.log(postLoader);

  // 포스트 팝업
  bricksInner.onclick = getFocusTarget((el: any) => storeMap.has(el), (el) => {
    const post = storeMap.get(el) as HashsnapPostItem;
    const popupEl = createPopupEls(post);
    popupRootDiv.appendChild(popupEl);
  });
  
  hsViewDiv.parentElement?.replaceChildren(bricksRoot); 

  // 포스트 로딩 방법 인터페이스 구분
  if (moreUI === 'button') {
    const moreButton = Object.assign(document.createElement('button'), {id: 'post-more', innerText: 'more'});
    morePostUIParent.appendChild(moreButton);

    postLoader.onRunout = () => morePostUIParent.parentElement?.removeChild(morePostUIParent);
    
    const postsEls = await postElsRender(columns * rows);
    columnRenderer.render(postsEls);

    const moreButtonHandler = async (ev: MouseEvent)  => {
      ev.preventDefault();
      const postsEls = await postElsRender(columns * rows);
      columnRenderer.render(postsEls);
    }
    moreButton.onclick = moreButtonHandler;
  } 
  else if (moreUI === 'pagination') {
    const postsEls = await postElsRender(pagination.page);
    columnRenderer.render(postsEls);

    const pageNumberHook = async (pageNum: number) => {
      if (pageNum === postLoader.page) return; // 현재 동일한 페이지 번호 선택 시 포스트 로드 비활성화
      storeMap.clear();
      columnRenderer.remove();

      const postsEls = await postElsRender(pageNum);
      columnRenderer.render(postsEls);
    }

    pagination.render();
    pagination.hook = pageNumberHook;
    bricksRoot.appendChild(pagination.root);
  }
  else if (moreUI === 'carousel') {
    const carousel = new Carousel(bricksInner);
    carousel.init(columns, Math.ceil(totalPost / (columns*rows)))
    
    const initPosts = await postElsRender(1);
    const newPosts = await postElsRender(2);
    carousel.initItem(initPosts, newPosts);
    carousel.next = async (pageNum: number) => {
      return await postElsRender(pageNum + 1) as HTMLElement[];
    }
  }

  // 윈도우 리사이징 이벤트
  window.addEventListener('resize', debounce((ev) => {
    const innerWidth = ev.target.innerWidth;
    if (innerWidth < 767) {
      console.log('모바일')
      const {columns} = defaultLayout['mobile'];
      columnRenderer.resize(columns);
    } 
    if (innerWidth > 768 && innerWidth < 1023) {
      console.log('태블릿')
      const {columns} = defaultLayout['tablet'];
      columnRenderer.resize(columns);
    } 
    if (innerWidth > 1024) {
      console.log('테스크탑')
      const {columns} = defaultLayout['desktop'];
      columnRenderer.resize(columns);
    } 
  }, 100));

  class BricksView {
    target!: HTMLElement; // <hashsnap-view>
    root: HTMLElement = Object.assign(document.createElement('div'), {id: 'hs-bricks-app'});
    moreParent: HTMLElement = Object.assign(document.createElement('div'), {id: 'post-more-parent'})
    
    postLoader!: PostLoader;
    columnRenderer!: ColumnRenderer;

    pagination!: Pagination;
    carousel!: Carousel;
    
    layout!: any; // 디바이스 별 레이아웃
    postOptions!: any; // 포스트 관련 옵션
    viewOptions!: any; // 뷰 관련 옵션

    method?: 'button'|'pagination'|'carousel';
    postLength: number = 0;
    constructor(
      target: HTMLElement, { 
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
      this.pagination = new Pagination(this.moreParent);
      this.method = viewOptions.method;

      this.init();
    }
    init() {
      const maxPageNum = Math.ceil(totalPost / (this.postLength));
      this.postLoader.init(this.postLength, maxPageNum);
      this.columnRenderer.init(Object.assign(document.createElement('div'), {className: "post-columns-main"}), columns);
      this.pagination.init(maxPageNum);
      this.carousel.init(columns, maxPageNum);

      this.loadMethod(this.method as 'button'|'pagination'|'carousel');
      this.postAppend();
    }
    breakpoint(parentWidth: number) {
      if (parentWidth < 767) { // 모바일
        const {columns, rows} = this.layout['mobile'];
        this.postLength = columns * rows;
      } 
      else if (parentWidth > 768 && parentWidth < 1023) { // 태블릿
        const {columns, rows} = this.layout['tablet'];
        this.postLength = columns * rows;
      } 
      else { // if (parentWidth > 1024) { // 데스크탑
        const {columns, rows} = this.layout['desktop'];
        this.postLength = columns * rows;
      } 
    }
    postAppend() {
      this.postLoader.load().then((posts: HashsnapPostItem[]) => {
        if (!posts.length) return;
        const postEls = this.postsNode(posts);
        this.columnRenderer.render(postEls);
      });
    }
    postsNode(posts: HashsnapPostItem[], hook?: (payload: any) => void) {
      const nodes = createdPostEls(posts);
      hook && hook(nodes);
      return nodes;
    }
    loadMethod(method: 'button'|'pagination'|'carousel') {
      this.method = method;
      switch(method) {
      case 'button': {
        this.postAppend();
        const button = Object.assign(document.createElement('button'), {
          id: 'post-more', 
          innerText: 'more',
          onclick: () => this.postAppend(),
        });
        this.moreParent.appendChild(button);
      }
      break;
      case 'carousel': {
        
      }
      break;
      case 'pagination': {
        
      }
      break;
      }
    }
    async buttonHandler() {
      
    }
  }

} catch(err) {
  console.error(err);
}}

main();  

// (window as any).hashsnapView = function(root: HTMLElement, options: any) {
//   'use strict';
// }

