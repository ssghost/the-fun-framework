function createState<T>(initialValue: T): {listeners: Array<() => void>, value: T} {
  let val = initialValue;
  let listeners = [] as Array<() => void>;
  return {
    get value() {
      return val;
    },
    set value(v: T) {
      val = v;
      listeners.forEach(fn => fn());
    },
    listeners
  };
}

const elements = {
  App(rootEl) {
    let count = createState(0);

    function updateCount() {
      count.value++;
    }

    return {
      count,
      updateCount
    }
  }
} as Record<string, (el: HTMLElement) => Record<string, unknown>>

function bindAndHandleElement<T extends Record<string, unknown>>(el: HTMLElement, data: T) {
  const dataKeys =Object.keys(el.dataset);
  for (let key of dataKeys) {
    if (key.startsWith("on")) {
      const name = key.replace(/^on([A-Z])/, (match) => match[2].toLowerCase())
      let fnNameWithCall = el.dataset[key]!;
      // TODO: Parse props being passed, bind them to the `data` keyword
      if (fnNameWithCall.endsWith("()")) {
        fnNameWithCall = fnNameWithCall.slice(0, fnNameWithCall.length - 2);
      }
      el.addEventListener(name, data[fnNameWithCall as never] as () => void);
      continue;
    }
    if (key === "bind") {
      const mutableState = data[el.dataset[key] as never] as ReturnType<typeof createState>
      mutableState.listeners.push(() => {
        el.innerText = mutableState.value as string;
      });
      el.innerText = mutableState.value as string;
    }
  }
}

function render(compName: string, rootEl: HTMLElement) {
  const data = elements[compName]?.(rootEl);
  // Roots cannot bind anything
  function bindAndHandleChildren(children: HTMLElement[]) {
    for (let child of children) {
      bindAndHandleElement(child, data);
      if (child.children) {
        bindAndHandleChildren([...child.children] as HTMLElement[])
      }
    }
  }
  bindAndHandleChildren([...rootEl.children] as HTMLElement[]);
}

const roots = [...document.querySelectorAll("[data-island-comp]")] as HTMLElement[];

for (let root of roots) {
  render(root.dataset.islandComp!, root);
}