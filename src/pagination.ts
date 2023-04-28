class Pagination {
  page: number = 1; // 현재 페이지 위치
  length: number = 5; // 한 번에 보여지는 페이지 길이
  totalLength: number = 0; // 총 페이지 개수
  
  cursor: number = 0; // 페이지 커서
  startIndex: number = 0; // limit 만큼의 페이지 그룹 중 첫번째 번호
  endIndex: number = 0; // limit 만큼의 페이지 그룹 중 마지막 번호
  pageIndexs: number[] = []; // 현재 페이지 번호 모음
  
  root!: HTMLElement; // 페이지 번호 요소들의 부모 요소
  hook!: (index: number) => void
  constructor(root: HTMLElement, pageLength: number = 5) {
    this.root = root
    this.length = pageLength;
  }
  init(totalLength: number) {
    this.totalLength = totalLength;
  }
  private setCurrentPage(index: number) {
    this.page = index;
    this.getCurrentPages();
    this.render();
    this.hook && this.hook(index);
  }
  private getCurrentPages() {
    this.cursor = this.page % this.length;
    this.startIndex = this.cursor === 0 ? this.page - this.length + 1 : this.page - this.cursor + 1;
    this.endIndex = this.cursor === 0 ?  this.page : this.page - this.cursor + this.length;
    if (this.endIndex > this.totalLength) this.endIndex = this.totalLength;
    const computedLength = (this.endIndex - this.startIndex) + 1;
    this.pageIndexs = Array.from({length: computedLength}, (_, index) => this.startIndex + index);
    return this.pageIndexs;
    // console.log(this.currentPage, this.pageLength)
  }
  render(totalLength = this.totalLength) {
    this.totalLength = totalLength;

    const pageIndexs = this.getCurrentPages();
    const pageElements: { el: HTMLButtonElement; page: number | null; event: () => void; }[] = pageIndexs.map((num) => {
      const button = Object.assign(document.createElement('button'), {innerText: num}) as HTMLButtonElement;
      return { el: button, page: num, event: () => this.setCurrentPage(num)}
    });

    const prevPage = {
      el: Object.assign(document.createElement('button'), {innerText: '◀', disabled: this.startIndex <= this.length ? true : false}) as HTMLButtonElement,
      page: this.startIndex < this.length ? null : this.startIndex - this.length,
      event: () => this.setCurrentPage(this.startIndex - this.length),
    };
    const nextPage = {
      el: Object.assign(document.createElement('button'), {innerText: '▶', disabled: this.endIndex >= this.totalLength ? true : false }) as HTMLButtonElement,
      page: this.endIndex > this.totalLength ? null : this.startIndex + this.length,
      event: () => this.setCurrentPage(this.startIndex + this.length),
    };
    pageElements.unshift(prevPage);
    pageElements.push(nextPage);
    
    [...this.root.children].forEach(child => this.root.removeChild(child));

    pageElements.forEach(({el, page, event}) => {
      this.root.appendChild(el)
      if (this.page === page) el.classList.add('active');
      el.onclick = () => event();
    });
    return this.root;
  }
}

export default Pagination;


// let currentPage = 310;
// const limit = 10;
// const pageCount = Math.ceil(totalPosts / itemLength);
// const startNumber = (currentPage / pageLength) * pageLength;
// const computedLength = (startNumber + pageLength - 1 < maxPageLength) ? pageLength : pageLength - (startNumber + pageLength - maxPageLength) + 1;
// const pageIndexes = Array.from({length: computedLength}, (_, index) => startNumber + index)
// console.log(startNumber, computedLength, pageIndexes)
