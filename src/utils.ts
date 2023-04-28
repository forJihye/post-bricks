/** 파이프 함수 */
export const pipe = (...functions: ((args: any) => void)[]) => (args: any) => functions.reduce((acc, func) => func(acc), args);

/** this 포함한 함수 */
export const createState = (f: (this: any) => void, defaultState = {}) => f.bind(defaultState);

/** n번 호출되면 f를 실행하는 카운터 함수 */
export const createCounter = (n: number, f: () => void) => createState(function(){
  (++this.count === n) && f();
}, { count: 0 });

/** HTML 텍스트를 엘리먼트로 반환하는 함수 */
export const html2Element = (html: string) => {
  const parent = Object.assign(document.createElement('div'), {innerHTML: html.trim()}) as HTMLDivElement;
  return parent.firstElementChild; 
}

/** 문서에서 가장 높은 z-index를 구하는 함수 */
export const getMaxZIndex = () => Math.max(...[...document.querySelectorAll('*')].map(el => (v => Number.isNaN(Number(v)) ? 0 : Number(v))(getComputedStyle(el,null).zIndex)));

/** 부모 엘리먼크 클릭 이벤트 최상위 자식 요소 대상 찾기 */
export const findTarget = (parent: HTMLElement, conditionCallback: Function) => (ev: Event) => {
  let currentTarget = ev.target as HTMLElement;
  while (currentTarget !== parent && currentTarget !== document.body.parentElement) {
    if (conditionCallback(currentTarget)) {
      return currentTarget;
    }
    if (!currentTarget) return null;
    currentTarget = currentTarget.parentElement as HTMLElement;
  }
  return null
}

/** 부모 첫번째 자식요소 삽입 */
export const insertChild = (parent: HTMLElement, el: HTMLElement) => parent.insertBefore(el, parent.firstElementChild);

/** 디바운스 */
export const debounce = (callback: (event: any) => void, delay: number) => {
  let timer: number;
  return (event: any) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, delay, event);
  }
}

/** 쓰로툴 */
export const throttle = (callback: (event: any) => void, delay: number) => {
  let timer: number|null;
  return (event: any) => {
    if (timer) return;
    timer = setTimeout(() => {
      callback(event);
      timer = null;
    }, delay, event);
  }
}