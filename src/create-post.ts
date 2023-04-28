import { format } from "date-fns";

const postAttrs = [ 'url', 'resolver', 'username', 'caption', 'created_date' ];

const postAttrsMapping = (parent: Element, attrs: string[]) => {
  const mapping = attrs.reduce((acc, val) => {
    (acc as any)[val] = parent.querySelector(`[data-${val}]`);
    return acc;
  }, { root: parent }) as any;
  return mapping;
}

const postAttrsRender = (postEl: {[k: string]: HTMLElement}, value: HashsnapPostItem) => {
  for (const attr in postEl) {
    const el = postEl[attr];
    switch(attr) {
      case 'url': {
        if (value.type === 'image') {
          const content = Object.assign(document.createElement('div'), { 
            className: 'post-content-image',
            style: `background-image: url(${value.url})`
          });
          el.appendChild(content);
        } else if (value.type === 'video') {
          const content = Object.assign(document.createElement('div'), { className: 'post-content-video' });
          const video = Object.assign(document.createElement('video'), { src: value.url });
          content.appendChild(video);
          el.appendChild(content);
        }
      }
      break;
      case 'resolver': el.dataset.resolver = value.resolver;
      break;
      case 'username': Object.assign(el, {innerText: value.username});
      break;
      case 'caption': {
        const innter = Object.assign(document.createElement('div'), {className: 'post-caption-inner', innerText: value.caption});
        el.appendChild(innter);
      }
      break;
      case 'created_date': Object.assign(el, {innerText: format(new Date(value.created_date), el.dataset["created_date"] as string)});
      break;
    }
  }
  return postEl.root;
}

const useCreatePostEls = (container: Element) => {
  return (post: HashsnapPostItem) => {
    const parent = container.cloneNode(true) as Element;
    const postEls = postAttrsMapping(parent, postAttrs);
    const root = postAttrsRender(postEls, post);
    return root;
  }
}

export default useCreatePostEls;