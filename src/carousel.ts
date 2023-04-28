import ColumnRenderer from "./column-renderer";

class CarouselItem {
  // parent: HTMLElement = Object.assign(document.createElement('div'), {className: "post-columns-main"})
  columnRenderer!: ColumnRenderer;
  constructor(public root: HTMLElement, columns: number) {
    this.columnRenderer = new ColumnRenderer(root);
    this.columnRenderer.init(columns);
  }
  render(data: HTMLElement[], width: number) {
    this.columnRenderer.render(data);
    this.columnRenderer.parent.style.width = width + 'px'; 
  }
}

class Carousel {
  root!: HTMLElement;
  container: HTMLElement = Object.assign(document.createElement('div'), {className: "carousel-container"});
  inner: HTMLElement = Object.assign(document.createElement('div'), {className: "carousel-innter"});
  prevBtn: HTMLElement = Object.assign(document.createElement('button'), {className: "prev-btn", innerText: 'prev'});
  nextBtn: HTMLElement = Object.assign(document.createElement('button'), {className: "next-btn", innerText: 'next'});
  
  store: CarouselItem[] = [];
  itemSize!: number;
  cursor: number = 0; // 현재 슬라이더 위치
  columns!: number;
  limit!: number;
  prev!: (pageNum: number) => void;
  next!: (pageNum: number) => Promise<HTMLElement[]>;

  isNext: boolean = false;
  isPrev: boolean = false;
  constructor(root: HTMLElement) {
    this.root = root;
    
    const rootRect = this.root.parentElement?.getBoundingClientRect() as DOMRect;
    this.itemSize = rootRect.width;
    this.container.style.width = rootRect.width + 'px';
    this.container.appendChild(this.inner);
    this.root.appendChild(this.container);

    this.prevBtn.addEventListener('click', async () => await this.prevHandler());
    this.nextBtn.addEventListener('click', async () => await this.nextHandler());
  }
  init(column: number, totalLength: number) {
    this.columns = column;
    this.limit = totalLength;
  }
  initItem(initItem: HTMLElement[], nextItem?: HTMLElement[]) {
    this.add(initItem);
    if (nextItem?.length) { // 다음 포스트가 있을 경우
      this.add(nextItem);
      this.container.prepend(this.nextBtn);
    };
    this.transform();
  }
  add(items: HTMLElement[]) {
    const carouselItem = new CarouselItem(this.inner, this.columns);
    this.store.push(carouselItem);
    this.store.forEach(item => item.render(items, this.itemSize));
  }
  async nextHandler() {
    if (!this.store[this.cursor + 2]) {
      const newPosts = await this.next?.(this.store.length);
      this.add(newPosts);
    }
    
    this.cursor += 1;
    this.transform();

    if (this.cursor + 2 === this.limit) {
      this.container.removeChild(this.nextBtn);
    } else {
      this.container.prepend(this.prevBtn);
    }
  }
  prevHandler() {
    this.cursor -= 1;
    this.transform();

    if (this.cursor === 0) {
      this.container.removeChild(this.prevBtn);
    } else {
      this.container.insertBefore(this.nextBtn, this.inner);
    } 
  }
  transform() {
    // console.log(this.itemSize, this.cursor, this.store.length);
    this.inner.style.width = this.itemSize * this.store.length + 'px';
    this.inner.style.transition = `transform 0.5s ease-in-out`;
    this.inner.style.transform = `translate3d(-${this.itemSize * this.cursor}px, 0, 0)`;
  }
}

export {
  CarouselItem,
  Carousel,
}