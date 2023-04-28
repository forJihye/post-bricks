class ColumnRenderer {
  cursor: number = 0;
  size!: number;
  columns: Element[] = [];
  parent: HTMLElement = Object.assign(document.createElement('div'), {className: "post-columns-main"});
  constructor(public root: HTMLElement) {}
  init(size: number) {
    this.size = size;
    this.cursor = 0;
    this.root.appendChild(this.parent);
    this.append(size);
  }
  private append(size: number) {
    this.size = size;
    Array.from({ length: size }, () => {
      const column = Object.assign(document.createElement('div'), {
        className: 'post-column',
        style: `width:${100 / size}%`
      });
      this.parent.appendChild(column);
      this.columns.push(column);
    });
  }
  render(postEls: HTMLElement[]) {
    for (const el of [...postEls]) {
      this.columns[this.cursor++ % this.size].appendChild(el);
      this.cursor = this.cursor % this.size;
    }
    return !!postEls.length;
  }
  remove() {
    this.columns.forEach(column => {
      [...column.children].forEach(child => column.removeChild(child));
    });
  }
  reset() {
    [...this.parent.children].forEach(column => this.parent.removeChild(column))
    this.cursor = 0;
    this.columns = [];
  }
  resize(size: number, postEls: HTMLElement[]) {
    this.reset();
    this.append(size);
    this.render(postEls);
  }
}

export default ColumnRenderer;