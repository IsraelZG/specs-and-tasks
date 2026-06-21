import { jsxs as O, jsx as c, Fragment as Ee } from "react/jsx-runtime";
import * as s from "react";
import { useLayoutEffect as Gd, useState as Vd } from "react";
import * as Ft from "react-dom";
import { createPortal as Ud } from "react-dom";
function Va(e) {
  var t, o, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var n = e.length;
    for (t = 0; t < n; t++) e[t] && (o = Va(e[t])) && (r && (r += " "), r += o);
  } else for (o in e) e[o] && (r && (r += " "), r += o);
  return r;
}
function Ua() {
  for (var e, t, o = 0, r = "", n = arguments.length; o < n; o++) (e = arguments[o]) && (t = Va(e)) && (r && (r += " "), r += t);
  return r;
}
const sa = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, la = Ua, Fe = (e, t) => (o) => {
  var r;
  if ((t == null ? void 0 : t.variants) == null) return la(e, o == null ? void 0 : o.class, o == null ? void 0 : o.className);
  const { variants: n, defaultVariants: a } = t, l = Object.keys(n).map((p) => {
    const f = o == null ? void 0 : o[p], d = a == null ? void 0 : a[p];
    if (f === null) return null;
    const v = sa(f) || sa(d);
    return n[p][v];
  }), i = o && Object.entries(o).reduce((p, f) => {
    let [d, v] = f;
    return v === void 0 || (p[d] = v), p;
  }, {}), u = t == null || (r = t.compoundVariants) === null || r === void 0 ? void 0 : r.reduce((p, f) => {
    let { class: d, className: v, ...h } = f;
    return Object.entries(h).every((g) => {
      let [m, b] = g;
      return Array.isArray(b) ? b.includes({
        ...a,
        ...i
      }[m]) : {
        ...a,
        ...i
      }[m] === b;
    }) ? [
      ...p,
      d,
      v
    ] : p;
  }, []);
  return la(e, l, u, o == null ? void 0 : o.class, o == null ? void 0 : o.className);
}, Ur = "-", Kd = (e) => {
  const t = Yd(e), {
    conflictingClassGroups: o,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (l) => {
      const i = l.split(Ur);
      return i[0] === "" && i.length !== 1 && i.shift(), Ka(i, t) || jd(l);
    },
    getConflictingClassGroupIds: (l, i) => {
      const u = o[l] || [];
      return i && r[l] ? [...u, ...r[l]] : u;
    }
  };
}, Ka = (e, t) => {
  var l;
  if (e.length === 0)
    return t.classGroupId;
  const o = e[0], r = t.nextPart.get(o), n = r ? Ka(e.slice(1), r) : void 0;
  if (n)
    return n;
  if (t.validators.length === 0)
    return;
  const a = e.join(Ur);
  return (l = t.validators.find(({
    validator: i
  }) => i(a))) == null ? void 0 : l.classGroupId;
}, ia = /^\[(.+)\]$/, jd = (e) => {
  if (ia.test(e)) {
    const t = ia.exec(e)[1], o = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (o)
      return "arbitrary.." + o;
  }
}, Yd = (e) => {
  const {
    theme: t,
    prefix: o
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return qd(Object.entries(e.classGroups), o).forEach(([a, l]) => {
    Nr(l, r, a, t);
  }), r;
}, Nr = (e, t, o, r) => {
  e.forEach((n) => {
    if (typeof n == "string") {
      const a = n === "" ? t : ca(t, n);
      a.classGroupId = o;
      return;
    }
    if (typeof n == "function") {
      if (Xd(n)) {
        Nr(n(r), t, o, r);
        return;
      }
      t.validators.push({
        validator: n,
        classGroupId: o
      });
      return;
    }
    Object.entries(n).forEach(([a, l]) => {
      Nr(l, ca(t, a), o, r);
    });
  });
}, ca = (e, t) => {
  let o = e;
  return t.split(Ur).forEach((r) => {
    o.nextPart.has(r) || o.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), o = o.nextPart.get(r);
  }), o;
}, Xd = (e) => e.isThemeGetter, qd = (e, t) => t ? e.map(([o, r]) => {
  const n = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([l, i]) => [t + l, i])) : a);
  return [o, n];
}) : e, Zd = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, o = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const n = (a, l) => {
    o.set(a, l), t++, t > e && (t = 0, r = o, o = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let l = o.get(a);
      if (l !== void 0)
        return l;
      if ((l = r.get(a)) !== void 0)
        return n(a, l), l;
    },
    set(a, l) {
      o.has(a) ? o.set(a, l) : n(a, l);
    }
  };
}, ja = "!", Qd = (e) => {
  const {
    separator: t,
    experimentalParseClassName: o
  } = e, r = t.length === 1, n = t[0], a = t.length, l = (i) => {
    const u = [];
    let p = 0, f = 0, d;
    for (let b = 0; b < i.length; b++) {
      let w = i[b];
      if (p === 0) {
        if (w === n && (r || i.slice(b, b + a) === t)) {
          u.push(i.slice(f, b)), f = b + a;
          continue;
        }
        if (w === "/") {
          d = b;
          continue;
        }
      }
      w === "[" ? p++ : w === "]" && p--;
    }
    const v = u.length === 0 ? i : i.substring(f), h = v.startsWith(ja), g = h ? v.substring(1) : v, m = d && d > f ? d - f : void 0;
    return {
      modifiers: u,
      hasImportantModifier: h,
      baseClassName: g,
      maybePostfixModifierPosition: m
    };
  };
  return o ? (i) => o({
    className: i,
    parseClassName: l
  }) : l;
}, Jd = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let o = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...o.sort(), r), o = []) : o.push(r);
  }), t.push(...o.sort()), t;
}, ef = (e) => ({
  cache: Zd(e.cacheSize),
  parseClassName: Qd(e),
  ...Kd(e)
}), tf = /\s+/, of = (e, t) => {
  const {
    parseClassName: o,
    getClassGroupId: r,
    getConflictingClassGroupIds: n
  } = t, a = [], l = e.trim().split(tf);
  let i = "";
  for (let u = l.length - 1; u >= 0; u -= 1) {
    const p = l[u], {
      modifiers: f,
      hasImportantModifier: d,
      baseClassName: v,
      maybePostfixModifierPosition: h
    } = o(p);
    let g = !!h, m = r(g ? v.substring(0, h) : v);
    if (!m) {
      if (!g) {
        i = p + (i.length > 0 ? " " + i : i);
        continue;
      }
      if (m = r(v), !m) {
        i = p + (i.length > 0 ? " " + i : i);
        continue;
      }
      g = !1;
    }
    const b = Jd(f).join(":"), w = d ? b + ja : b, y = w + m;
    if (a.includes(y))
      continue;
    a.push(y);
    const x = n(m, g);
    for (let C = 0; C < x.length; ++C) {
      const R = x[C];
      a.push(w + R);
    }
    i = p + (i.length > 0 ? " " + i : i);
  }
  return i;
};
function rf() {
  let e = 0, t, o, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (o = Ya(t)) && (r && (r += " "), r += o);
  return r;
}
const Ya = (e) => {
  if (typeof e == "string")
    return e;
  let t, o = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Ya(e[r])) && (o && (o += " "), o += t);
  return o;
};
function nf(e, ...t) {
  let o, r, n, a = l;
  function l(u) {
    const p = t.reduce((f, d) => d(f), e());
    return o = ef(p), r = o.cache.get, n = o.cache.set, a = i, i(u);
  }
  function i(u) {
    const p = r(u);
    if (p)
      return p;
    const f = of(u, o);
    return n(u, f), f;
  }
  return function() {
    return a(rf.apply(null, arguments));
  };
}
const Q = (e) => {
  const t = (o) => o[e] || [];
  return t.isThemeGetter = !0, t;
}, Xa = /^\[(?:([a-z-]+):)?(.+)\]$/i, af = /^\d+\/\d+$/, sf = /* @__PURE__ */ new Set(["px", "full", "screen"]), lf = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, cf = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, uf = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, df = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, ff = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, De = (e) => ut(e) || sf.has(e) || af.test(e), ze = (e) => bt(e, "length", wf), ut = (e) => !!e && !Number.isNaN(Number(e)), dr = (e) => bt(e, "number", ut), Pt = (e) => !!e && Number.isInteger(Number(e)), pf = (e) => e.endsWith("%") && ut(e.slice(0, -1)), W = (e) => Xa.test(e), Be = (e) => lf.test(e), vf = /* @__PURE__ */ new Set(["length", "size", "percentage"]), mf = (e) => bt(e, vf, qa), hf = (e) => bt(e, "position", qa), gf = /* @__PURE__ */ new Set(["image", "url"]), bf = (e) => bt(e, gf, Cf), yf = (e) => bt(e, "", xf), At = () => !0, bt = (e, t, o) => {
  const r = Xa.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : o(r[2]) : !1;
}, wf = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  cf.test(e) && !uf.test(e)
), qa = () => !1, xf = (e) => df.test(e), Cf = (e) => ff.test(e), Sf = () => {
  const e = Q("colors"), t = Q("spacing"), o = Q("blur"), r = Q("brightness"), n = Q("borderColor"), a = Q("borderRadius"), l = Q("borderSpacing"), i = Q("borderWidth"), u = Q("contrast"), p = Q("grayscale"), f = Q("hueRotate"), d = Q("invert"), v = Q("gap"), h = Q("gradientColorStops"), g = Q("gradientColorStopPositions"), m = Q("inset"), b = Q("margin"), w = Q("opacity"), y = Q("padding"), x = Q("saturate"), C = Q("scale"), R = Q("sepia"), E = Q("skew"), P = Q("space"), I = Q("translate"), _ = () => ["auto", "contain", "none"], D = () => ["auto", "hidden", "clip", "visible", "scroll"], F = () => ["auto", W, t], T = () => [W, t], H = () => ["", De, ze], B = () => ["auto", ut, W], U = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], z = () => ["solid", "dashed", "dotted", "double", "none"], G = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], k = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], A = () => ["", "0", W], V = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], K = () => [ut, W];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [At],
      spacing: [De, ze],
      blur: ["none", "", Be, W],
      brightness: K(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Be, W],
      borderSpacing: T(),
      borderWidth: H(),
      contrast: K(),
      grayscale: A(),
      hueRotate: K(),
      invert: A(),
      gap: T(),
      gradientColorStops: [e],
      gradientColorStopPositions: [pf, ze],
      inset: F(),
      margin: F(),
      opacity: K(),
      padding: T(),
      saturate: K(),
      scale: K(),
      sepia: A(),
      skew: K(),
      space: T(),
      translate: T()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", W]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [Be]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": V()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": V()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...U(), W]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: D()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": D()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": D()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: _()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": _()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": _()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", Pt, W]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: F()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", W]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: A()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: A()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Pt, W]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [At]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Pt, W]
        }, W]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": B()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": B()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [At]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Pt, W]
        }, W]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": B()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": B()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", W]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", W]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [v]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [v]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [v]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...k()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...k(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...k(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [y]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [y]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [y]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [y]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [y]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [y]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [y]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [y]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [y]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [b]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [b]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [b]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [b]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [b]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [b]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [b]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [b]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [b]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [P]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [P]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", W, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [W, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [W, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Be]
        }, Be]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [W, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [W, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [W, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [W, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Be, ze]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", dr]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [At]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", W]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", ut, dr]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", De, W]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", W]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", W]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [w]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [w]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...z(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", De, ze]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", De, W]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: T()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", W]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", W]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [w]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...U(), hf]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", mf]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, bf]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [h]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [h]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [h]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [i]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [i]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [i]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [i]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [i]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [i]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [i]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [i]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [i]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [w]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...z(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [i]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [i]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [w]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: z()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [n]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [n]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [n]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [n]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [n]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [n]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [n]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [n]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [n]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [n]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...z()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [De, W]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [De, ze]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: H()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [w]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [De, ze]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", Be, yf]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [At]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [w]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...G(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": G()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [o]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [u]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Be, W]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [p]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [d]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [x]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [R]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [o]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [u]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [p]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [f]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [d]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [w]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [R]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [l]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [l]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [l]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", W]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: K()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", W]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: K()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", W]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [C]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [C]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [C]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Pt, W]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [I]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [I]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [E]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [E]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", W]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", W]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": T()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": T()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": T()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": T()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": T()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": T()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": T()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": T()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": T()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": T()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": T()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": T()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": T()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": T()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": T()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": T()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": T()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": T()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", W]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [De, ze, dr]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, Rf = /* @__PURE__ */ nf(Sf);
function S(...e) {
  return Rf(Ua(e));
}
const We = Fe(
  [
    "inline-flex items-center justify-center whitespace-nowrap select-none",
    "rounded-[var(--ds-component-button-radius)]",
    "font-[var(--ds-component-button-font-weight)] text-sm leading-none",
    "gap-[var(--ds-component-button-gap)]",
    "transition-[background-color,box-shadow,transform]",
    "duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
    "cursor-pointer",
    // Focus ring — shared focusRing.* tokens, keyboard-only
    "focus-visible:outline-none",
    "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
    "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
    "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
    // Press
    "active:scale-[0.98] active:duration-[50ms] active:ease-[cubic-bezier(0.4,0,1,1)]"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--ds-component-button-primary-bg)]",
          "text-[var(--ds-component-button-primary-text)]",
          "hover:bg-[var(--ds-component-button-primary-bg-hover)]"
        ],
        secondary: [
          "bg-[var(--ds-component-button-secondary-bg)]",
          "text-[var(--ds-component-button-secondary-text)]",
          "border border-[var(--ds-component-button-secondary-border)]",
          "hover:bg-[var(--ds-component-button-secondary-bg-hover)]"
        ],
        ghost: [
          "bg-[var(--ds-component-button-ghost-bg)]",
          "text-[var(--ds-component-button-ghost-text)]",
          "hover:bg-[var(--ds-component-button-ghost-bg-hover)]"
        ],
        danger: [
          "bg-[var(--ds-component-button-danger-bg)]",
          "text-[var(--ds-component-button-danger-text)]",
          "hover:bg-[var(--ds-component-button-danger-bg-hover)]"
        ]
      },
      size: {
        sm: "h-[var(--ds-component-button-height-sm)] px-[var(--ds-component-button-padding-x-sm)]",
        md: "h-[var(--ds-component-button-height-md)] px-[var(--ds-component-button-padding-x-md)]",
        lg: "h-[var(--ds-component-button-height-lg)] px-[var(--ds-component-button-padding-x-lg)]"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
), Za = s.forwardRef(
  ({
    children: e,
    variant: t,
    size: o,
    fullWidth: r,
    loading: n = !1,
    disabled: a,
    className: l,
    type: i = "button",
    ...u
  }, p) => /* @__PURE__ */ O(
    "button",
    {
      ref: p,
      type: i,
      disabled: a || n,
      "aria-busy": n || void 0,
      "aria-disabled": a || n || void 0,
      className: S(We({ variant: t, size: o, fullWidth: r }), l),
      ...u,
      children: [
        n && /* @__PURE__ */ O(
          "svg",
          {
            "aria-hidden": "true",
            className: "animate-spin h-[1em] w-[1em] shrink-0",
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            children: [
              /* @__PURE__ */ c(
                "circle",
                {
                  className: "opacity-25",
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "4"
                }
              ),
              /* @__PURE__ */ c(
                "path",
                {
                  className: "opacity-75",
                  fill: "currentColor",
                  d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                }
              )
            ]
          }
        ),
        e
      ]
    }
  )
);
Za.displayName = "Button";
const Nf = Fe(
  [
    "block text-inherit no-underline",
    "rounded-[var(--ds-component-card-radius)]",
    "bg-[var(--ds-component-card-bg)]",
    "border border-[var(--ds-component-card-border)]",
    "shadow-[var(--ds-component-card-shadow)]",
    "transition-[box-shadow,transform] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
  ],
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-[var(--ds-component-card-padding)]",
        lg: "p-10"
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:shadow-[var(--ds-component-card-shadow-hover)]",
          "hover:-translate-y-0.5",
          "active:shadow-[var(--ds-component-card-shadow)]",
          "active:translate-y-0",
          "focus-visible:outline-none",
          "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
          "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
          "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]"
        ]
      }
    },
    defaultVariants: {
      padding: "md",
      interactive: !1
    }
  }
), Ef = s.forwardRef(
  ({ as: e = "div", padding: t, interactive: o, className: r, children: n, ...a }, l) => s.createElement(
    e,
    {
      ref: l,
      className: S(Nf({ padding: t, interactive: o }), r),
      ...a
    },
    n
  )
);
Ef.displayName = "Card";
const Pf = {
  sm: "h-[var(--ds-component-input-height-sm)]",
  md: "h-[var(--ds-component-input-height-md)]",
  lg: "h-[var(--ds-component-input-height-lg)]"
}, Qa = s.forwardRef(
  ({
    size: e = "md",
    leadingIcon: t,
    trailingIcon: o,
    invalid: r = !1,
    disabled: n,
    readOnly: a,
    className: l,
    ...i
  }, u) => /* @__PURE__ */ O(
    "div",
    {
      className: S(
        "relative flex items-center",
        "rounded-[var(--ds-component-input-radius)]",
        "bg-[var(--ds-component-input-bg)]",
        "border transition-[border-color,box-shadow] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        Pf[e],
        // Border states
        !r && [
          "border-[var(--ds-component-input-border)]",
          "hover:border-[var(--ds-component-input-border-hover)]"
        ],
        r && "border-[var(--ds-component-input-border-error)]",
        // Focus state via CSS :has() — no JS needed
        "has-[:focus-visible]:border-[var(--ds-component-input-border-focus)]",
        "has-[:focus-visible]:shadow-[var(--ds-component-input-shadow-focus)]",
        // Disabled
        n && "bg-[var(--ds-component-input-bg-disabled)] pointer-events-none opacity-50",
        l
      ),
      children: [
        t && /* @__PURE__ */ c(
          "span",
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute left-[var(--ds-component-input-padding-x)] text-[var(--ds-component-input-placeholder)] flex items-center",
            children: t
          }
        ),
        /* @__PURE__ */ c(
          "input",
          {
            ref: u,
            disabled: n,
            readOnly: a,
            "aria-invalid": r || void 0,
            "aria-readonly": a || void 0,
            className: S(
              "w-full h-full bg-transparent outline-none",
              "text-[color:var(--ds-component-input-text)] text-sm",
              "placeholder:text-[color:var(--ds-component-input-placeholder)]",
              "px-[var(--ds-component-input-padding-x)]",
              t && "pl-10",
              o && "pr-10"
            ),
            ...i
          }
        ),
        o && /* @__PURE__ */ c(
          "span",
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute right-[var(--ds-component-input-padding-x)] text-[var(--ds-component-input-placeholder)] flex items-center",
            children: o
          }
        )
      ]
    }
  )
);
Qa.displayName = "Input";
const Af = {
  sending: "○",
  sent: "✓",
  delivered: "✓✓",
  read: "✓✓",
  failed: "!"
}, _f = s.forwardRef(
  ({
    children: e,
    author: t,
    timestamp: o,
    status: r,
    density: n = "cozy",
    reactions: a,
    isEditing: l = !1,
    className: i
  }, u) => {
    if (t === "system")
      return /* @__PURE__ */ c(
        "div",
        {
          ref: u,
          role: "status",
          className: S("flex w-full justify-center", i),
          children: /* @__PURE__ */ c("p", { className: "text-xs text-[color:var(--ds-theme-content-muted)]", children: e })
        }
      );
    const p = t === "sent", f = t === "ai", d = r === "failed", v = r === "sending";
    return /* @__PURE__ */ O(
      "div",
      {
        ref: u,
        className: S(
          "flex w-full flex-col",
          p ? "items-end" : "items-start",
          n === "compact" ? "gap-0.5" : "gap-1",
          i
        ),
        children: [
          /* @__PURE__ */ O(
            "div",
            {
              className: S(
                "relative max-w-[70%]",
                "rounded-[var(--ds-component-message-radius)]",
                "px-[var(--ds-component-message-padding-x)] py-[var(--ds-component-message-padding-y)]",
                "text-sm leading-relaxed",
                // Color — author drives both bg and text
                p && "bg-[var(--ds-component-message-bg-sent)] text-[color:var(--ds-component-message-text-sent)]",
                !p && !f && "bg-[var(--ds-component-message-bg-received)] text-[color:var(--ds-component-message-text-received)]",
                // ai: theme exception documented in metadata
                f && "bg-[var(--ds-theme-intent-accent-subtle)] text-[color:var(--ds-component-message-text-received)]",
                // Delivery states
                v && "opacity-60",
                // failed: theme exception documented in metadata
                d && "border-2 border-[var(--ds-theme-intent-danger-border)]",
                // Tail corner: reduce attachment-side bottom corner (showcase.html .bubble pattern)
                p && "rounded-br-[var(--ds-radius-sm)]",
                !p && !f && "rounded-bl-[var(--ds-radius-sm)]"
              ),
              "aria-busy": v || void 0,
              children: [
                f && /* @__PURE__ */ c(
                  "span",
                  {
                    "aria-label": "AI assistant",
                    className: "mb-1 block text-xs font-semibold opacity-60",
                    children: "AI"
                  }
                ),
                l ? /* @__PURE__ */ c(
                  "div",
                  {
                    role: "textbox",
                    "aria-multiline": "true",
                    contentEditable: !0,
                    suppressContentEditableWarning: !0,
                    className: "outline-none",
                    children: e
                  }
                ) : e
              ]
            }
          ),
          a && /* @__PURE__ */ c("div", { className: p ? "mr-2" : "ml-2", children: a }),
          (o || r && p) && /* @__PURE__ */ O(
            "div",
            {
              className: S(
                "flex items-center gap-1 text-xs opacity-50",
                p ? "flex-row-reverse" : "flex-row"
              ),
              children: [
                o && /* @__PURE__ */ c(
                  "time",
                  {
                    dateTime: o instanceof Date ? o.toISOString() : o,
                    children: o instanceof Date ? o.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : o
                  }
                ),
                r && p && /* @__PURE__ */ c("span", { "aria-label": r, children: Af[r] })
              ]
            }
          )
        ]
      }
    );
  }
);
_f.displayName = "Message";
const Tf = [
  "flex items-center w-full",
  "rounded-[var(--ds-component-navigation-item-radius)]",
  "transition-[background-color,color] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
  "cursor-pointer",
  "focus-visible:outline-none",
  "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
  "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
  "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]"
].join(" "), Mf = {
  sm: "h-8 px-[var(--ds-component-navigation-item-padding-x)] gap-[var(--ds-component-navigation-item-gap)] text-xs",
  md: "h-[var(--ds-component-navigation-item-height)] px-[var(--ds-component-navigation-item-padding-x)] gap-[var(--ds-component-navigation-item-gap)] text-sm"
}, If = s.forwardRef(
  ({
    as: e = "a",
    children: t,
    icon: o,
    trailing: r,
    active: n = !1,
    disabled: a = !1,
    collapsed: l = !1,
    tone: i = "default",
    size: u = "md",
    className: p,
    ...f
  }, d) => {
    const h = n ? "bg-[var(--ds-component-navigation-item-bg-active)] text-[color:var(--ds-component-navigation-item-text-active)]" : i === "inverse" ? "bg-transparent text-[color:var(--ds-theme-content-on-inverse)] hover:bg-white/10" : "bg-transparent text-[color:var(--ds-component-navigation-item-text-inactive)] hover:bg-[var(--ds-component-navigation-item-bg-hover)] hover:text-[color:var(--ds-component-navigation-item-text-active)]", g = a ? "pointer-events-none opacity-50" : "";
    return s.createElement(
      e,
      {
        ref: d,
        // a11y: aria-current for links, aria-pressed for buttons
        "aria-current": n && e === "a" ? "page" : void 0,
        "aria-pressed": n && e === "button" ? !0 : void 0,
        "aria-disabled": a || void 0,
        tabIndex: a ? -1 : void 0,
        className: S(
          Tf,
          Mf[u],
          h,
          g,
          l && "justify-center px-0",
          p
        ),
        ...f
      },
      /* @__PURE__ */ O(Ee, { children: [
        o && /* @__PURE__ */ c("span", { "aria-hidden": "true", className: "flex shrink-0 items-center justify-center", children: o }),
        /* @__PURE__ */ c("span", { className: S("flex-1 truncate", l && "sr-only"), children: t }),
        r && !l && /* @__PURE__ */ c("span", { "aria-hidden": "true", className: "ml-auto flex shrink-0 items-center", children: r })
      ] })
    );
  }
);
If.displayName = "NavItem";
const Df = ({ intent: e }) => {
  const t = "shrink-0 mt-0.5";
  return e === "success" ? /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [
    /* @__PURE__ */ c("circle", { cx: "8", cy: "8", r: "7", fill: "currentColor", opacity: ".15" }),
    /* @__PURE__ */ c("path", { d: "M5 8l2 2 4-4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }) : e === "warning" ? /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [
    /* @__PURE__ */ c("path", { d: "M8 2L14.5 13H1.5L8 2Z", fill: "currentColor", opacity: ".15", stroke: "currentColor", strokeWidth: "1.25", strokeLinejoin: "round" }),
    /* @__PURE__ */ c("path", { d: "M8 6.5v3M8 11h.01", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  ] }) : e === "danger" ? /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [
    /* @__PURE__ */ c("circle", { cx: "8", cy: "8", r: "7", fill: "currentColor", opacity: ".15", stroke: "currentColor", strokeWidth: "1.25" }),
    /* @__PURE__ */ c("path", { d: "M5.5 5.5l5 5M10.5 5.5l-5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  ] }) : /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: [
    /* @__PURE__ */ c("circle", { cx: "8", cy: "8", r: "7", fill: "currentColor", opacity: ".15", stroke: "currentColor", strokeWidth: "1.25" }),
    /* @__PURE__ */ c("path", { d: "M8 7v4M8 5h.01", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  ] });
}, fr = {
  info: "var(--ds-component-toast-accent-info)",
  success: "var(--ds-component-toast-accent-success)",
  warning: "var(--ds-component-toast-accent-warning)",
  danger: "var(--ds-component-toast-accent-danger)"
}, kf = Fe(
  [
    "fixed z-[600] flex items-start overflow-hidden",
    "rounded-[var(--ds-component-toast-radius)]",
    "border border-[var(--ds-component-toast-border)]",
    "bg-[var(--ds-component-toast-bg)]",
    "shadow-[var(--ds-component-toast-shadow)]",
    "text-[color:var(--ds-component-toast-text)] text-sm",
    "min-w-[var(--ds-component-toast-min-width)]",
    "max-w-[var(--ds-component-toast-max-width)]",
    "transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
  ],
  {
    variants: {
      placement: {
        "top-right": "top-4 right-4",
        "top-center": "top-4 left-1/2 -translate-x-1/2",
        "bottom-right": "bottom-4 right-4",
        "bottom-center": "bottom-4 left-1/2 -translate-x-1/2"
      },
      visible: {
        true: "opacity-100 translate-y-0",
        false: "opacity-0 translate-y-2 pointer-events-none"
      }
    },
    defaultVariants: {
      placement: "top-right",
      visible: !0
    }
  }
), Of = s.forwardRef(
  ({
    children: e,
    intent: t = "info",
    placement: o = "top-right",
    duration: r = 5e3,
    action: n,
    onDismiss: a,
    showClose: l = !0,
    icon: i,
    className: u,
    ...p
  }, f) => {
    const [d, v] = s.useState(!1), h = s.useRef(null);
    s.useEffect(() => {
      const y = requestAnimationFrame(() => {
        v(!0);
      });
      return () => {
        cancelAnimationFrame(y);
      };
    }, []);
    const g = s.useCallback(() => {
      r !== null && (h.current = setTimeout(() => {
        v(!1), setTimeout(() => a == null ? void 0 : a(), 200);
      }, r));
    }, [r, a]), m = s.useCallback(() => {
      h.current && clearTimeout(h.current);
    }, []);
    s.useEffect(() => {
      if (d)
        return g(), m;
    }, [d, g, m]);
    const b = () => {
      m(), v(!1), setTimeout(() => a == null ? void 0 : a(), 200);
    }, w = t === "danger" || t === "warning";
    return /* @__PURE__ */ O(
      "div",
      {
        ref: f,
        role: w ? "alert" : "status",
        "aria-live": w ? "assertive" : "polite",
        "aria-atomic": "true",
        onMouseEnter: m,
        onMouseLeave: g,
        onFocus: m,
        onBlur: g,
        className: S(kf({ placement: o, visible: d }), u),
        ...p,
        children: [
          /* @__PURE__ */ c(
            "span",
            {
              "aria-hidden": "true",
              className: "w-2 shrink-0 self-stretch",
              style: { backgroundColor: fr[t] }
            }
          ),
          /* @__PURE__ */ O(
            "div",
            {
              className: "flex flex-1 items-start gap-[var(--ds-component-toast-gap)] px-[var(--ds-component-toast-padding-x)] py-[var(--ds-component-toast-padding-y)]",
              style: { color: fr[t] },
              children: [
                /* @__PURE__ */ c("span", { style: { color: fr[t] }, children: i ?? /* @__PURE__ */ c(Df, { intent: t }) }),
                /* @__PURE__ */ c("span", { className: "flex-1 text-[color:var(--ds-component-toast-text)]", children: e }),
                n && /* @__PURE__ */ c("span", { className: "shrink-0", children: n }),
                l && !n && /* @__PURE__ */ c(
                  "button",
                  {
                    type: "button",
                    "aria-label": "Dismiss notification",
                    onClick: b,
                    className: S(
                      "shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100",
                      "text-[color:var(--ds-component-toast-text-muted)]",
                      "transition-opacity duration-[150ms]",
                      "focus-visible:outline-none",
                      "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
                      "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
                      "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]"
                    ),
                    children: /* @__PURE__ */ c("svg", { "aria-hidden": "true", width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: /* @__PURE__ */ c("path", { d: "M2 2l10 10M12 2L2 12", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
                  }
                )
              ]
            }
          )
        ]
      }
    );
  }
);
Of.displayName = "Toast";
const Ff = Fe(
  [
    "inline-flex items-center whitespace-nowrap select-none",
    "rounded-[var(--ds-component-badge-radius)]",
    "px-[var(--ds-component-badge-padding-x)]",
    "py-[var(--ds-component-badge-padding-y)]",
    "text-[length:var(--ds-component-badge-font-size)]",
    "font-[var(--ds-component-badge-font-weight)]",
    "leading-none"
  ],
  {
    variants: {
      intent: {
        neutral: "bg-[var(--ds-component-badge-neutral-bg)] text-[color:var(--ds-component-badge-neutral-text)]",
        success: "bg-[var(--ds-component-badge-success-bg)] text-[color:var(--ds-component-badge-success-text)]",
        warning: "bg-[var(--ds-component-badge-warning-bg)] text-[color:var(--ds-component-badge-warning-text)]",
        danger: "bg-[var(--ds-component-badge-danger-bg)]  text-[color:var(--ds-component-badge-danger-text)]",
        info: "bg-[var(--ds-component-badge-info-bg)]    text-[color:var(--ds-component-badge-info-text)]"
      },
      size: {
        sm: "text-[10px]",
        md: ""
      }
    },
    defaultVariants: {
      intent: "neutral",
      size: "md"
    }
  }
), Lf = s.forwardRef(
  ({ children: e, intent: t, size: o, className: r, ...n }, a) => /* @__PURE__ */ c(
    "span",
    {
      ref: a,
      className: S(Ff({ intent: t, size: o }), r),
      ...n,
      children: e
    }
  )
);
Lf.displayName = "Badge";
const $f = Fe(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none",
    "rounded-[var(--ds-component-avatar-radius)]",
    "bg-[var(--ds-component-avatar-fallback-bg)]",
    "text-[color:var(--ds-component-avatar-fallback-text)]",
    "font-semibold leading-none"
  ],
  {
    variants: {
      size: {
        xs: "w-[var(--ds-component-avatar-size-xs)]  h-[var(--ds-component-avatar-size-xs)]  text-[9px]",
        sm: "w-[var(--ds-component-avatar-size-sm)]  h-[var(--ds-component-avatar-size-sm)]  text-[11px]",
        md: "w-[var(--ds-component-avatar-size-md)]  h-[var(--ds-component-avatar-size-md)]  text-[13px]",
        lg: "w-[var(--ds-component-avatar-size-lg)]  h-[var(--ds-component-avatar-size-lg)]  text-base",
        xl: "w-[var(--ds-component-avatar-size-xl)]  h-[var(--ds-component-avatar-size-xl)]  text-xl",
        "2xl": "w-[var(--ds-component-avatar-size-2xl)] h-[var(--ds-component-avatar-size-2xl)] text-3xl"
      },
      ring: {
        true: "outline outline-[length:var(--ds-component-avatar-ring-width)] outline-[color:var(--ds-component-avatar-ring-color)] outline-offset-[2px]"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
), zf = () => /* @__PURE__ */ c("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "currentColor", className: "w-[55%] h-[55%] opacity-60", children: /* @__PURE__ */ c("path", { d: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z" }) }), Bf = s.forwardRef(
  ({ src: e, alt: t = "", fallback: o, size: r, ring: n, className: a, ...l }, i) => {
    const [u, p] = s.useState(!1), f = e && !u;
    return /* @__PURE__ */ c(
      "span",
      {
        ref: i,
        role: "img",
        "aria-label": t || void 0,
        className: S($f({ size: r, ring: n }), a),
        ...l,
        children: f ? /* @__PURE__ */ c(
          "img",
          {
            src: e,
            alt: t,
            "aria-hidden": "true",
            className: "w-full h-full object-cover",
            onError: () => {
              p(!0);
            }
          }
        ) : o ? /* @__PURE__ */ c("span", { "aria-hidden": "true", children: o.slice(0, 2).toUpperCase() }) : /* @__PURE__ */ c(zf, {})
      }
    );
  }
);
Bf.displayName = "Avatar";
const Hf = Fe(
  [
    "relative flex flex-col w-full mx-auto",
    "rounded-[var(--ds-component-modal-radius)]",
    "bg-[var(--ds-component-modal-bg)]",
    "shadow-[var(--ds-component-modal-shadow)]",
    "p-[var(--ds-component-modal-padding)]",
    "transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
    "max-h-[calc(100dvh-4rem)] overflow-y-auto"
  ],
  {
    variants: {
      size: {
        sm: "max-w-[var(--ds-component-modal-width-sm)]",
        md: "max-w-[var(--ds-component-modal-width-md)]",
        lg: "max-w-[var(--ds-component-modal-width-lg)]",
        fullscreen: "max-w-none w-full h-dvh m-0 rounded-none"
      },
      visible: {
        true: "opacity-100 scale-100",
        false: "opacity-0 scale-95 pointer-events-none"
      }
    },
    defaultVariants: {
      size: "md",
      visible: !0
    }
  }
);
function Wf(e, t) {
  s.useEffect(() => {
    if (!t || !e.current) return;
    const o = e.current, r = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])', n = () => Array.from(o.querySelectorAll(r)), a = n()[0];
    a == null || a.focus();
    const l = (i) => {
      if (i.key !== "Tab") return;
      const u = n();
      if (u.length === 0) {
        i.preventDefault();
        return;
      }
      const p = u.indexOf(document.activeElement);
      i.shiftKey ? p <= 0 && (i.preventDefault(), u[u.length - 1].focus()) : p === u.length - 1 && (i.preventDefault(), u[0].focus());
    };
    return document.addEventListener("keydown", l), () => {
      document.removeEventListener("keydown", l);
    };
  }, [t, e]);
}
const Ja = ({
  open: e,
  onClose: t,
  children: o,
  size: r = "md",
  title: n,
  dismissible: a = !0,
  className: l
}) => {
  const i = s.useRef(null), [u, p] = s.useState(!1), [f, d] = s.useState(!1), v = s.useRef(null);
  if (s.useEffect(() => {
    e && (v.current = document.activeElement);
  }, [e]), s.useEffect(() => {
    if (!e) return;
    const g = window.innerWidth - document.documentElement.clientWidth, m = document.body.style.overflow, b = document.body.style.paddingRight;
    return document.body.style.overflow = "hidden", g > 0 && (document.body.style.paddingRight = `${String(g)}px`), () => {
      document.body.style.overflow = m, document.body.style.paddingRight = b;
    };
  }, [e]), s.useEffect(() => {
    if (e) {
      p(!0);
      const g = requestAnimationFrame(() => {
        d(!0);
      });
      return () => {
        cancelAnimationFrame(g);
      };
    } else {
      d(!1);
      const g = setTimeout(() => {
        var m;
        p(!1), (m = v.current) == null || m.focus();
      }, 200);
      return () => {
        clearTimeout(g);
      };
    }
  }, [e]), Wf(i, f), s.useEffect(() => {
    if (!f || !a) return;
    const g = (m) => {
      m.key === "Escape" && t();
    };
    return document.addEventListener("keydown", g), () => {
      document.removeEventListener("keydown", g);
    };
  }, [f, a, t]), !u || typeof document > "u") return null;
  const h = n ? "modal-title" : void 0;
  return Ud(
    /* @__PURE__ */ O(
      "div",
      {
        className: "fixed inset-0 z-[400] flex items-center justify-center p-4",
        "aria-modal": "true",
        children: [
          /* @__PURE__ */ c(
            "div",
            {
              "aria-hidden": "true",
              className: S(
                "absolute inset-0 bg-[var(--ds-component-modal-scrim)]",
                "transition-opacity duration-[200ms]",
                f ? "opacity-100" : "opacity-0"
              ),
              onClick: a ? t : void 0
            }
          ),
          /* @__PURE__ */ O(
            "div",
            {
              ref: i,
              role: "dialog",
              "aria-modal": "true",
              "aria-labelledby": h,
              className: S(Hf({ size: r, visible: f }), l),
              children: [
                (n || a) && /* @__PURE__ */ O("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
                  n && /* @__PURE__ */ c("h2", { id: "modal-title", className: "text-lg font-semibold leading-snug", children: n }),
                  a && /* @__PURE__ */ c(
                    "button",
                    {
                      type: "button",
                      "aria-label": "Close dialog",
                      onClick: t,
                      className: S(
                        "shrink-0 rounded-lg p-1.5 -mr-1 -mt-1 opacity-60 hover:opacity-100",
                        "transition-opacity duration-[150ms]",
                        "focus-visible:outline-none",
                        "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
                        "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
                        "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]"
                      ),
                      children: /* @__PURE__ */ c("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ c("path", { d: "M2 2l12 12M14 2L2 14", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round" }) })
                    }
                  )
                ] }),
                o
              ]
            }
          )
        ]
      }
    ),
    document.body
  );
};
Ja.displayName = "Modal";
const Gf = ({ intent: e }) => {
  const t = "shrink-0 mt-0.5 w-[18px] h-[18px]";
  return e === "success" ? /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, viewBox: "0 0 18 18", fill: "none", children: [
    /* @__PURE__ */ c("circle", { cx: "9", cy: "9", r: "8", fill: "currentColor", opacity: ".2" }),
    /* @__PURE__ */ c("path", { d: "M5.5 9l2.5 2.5 4.5-5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
  ] }) : e === "warning" ? /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, viewBox: "0 0 18 18", fill: "none", children: [
    /* @__PURE__ */ c("path", { d: "M9 2.5L16 15.5H2L9 2.5Z", fill: "currentColor", opacity: ".2", stroke: "currentColor", strokeWidth: "1.25", strokeLinejoin: "round" }),
    /* @__PURE__ */ c("path", { d: "M9 7v4M9 12.5h.01", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  ] }) : e === "danger" ? /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, viewBox: "0 0 18 18", fill: "none", children: [
    /* @__PURE__ */ c("circle", { cx: "9", cy: "9", r: "8", fill: "currentColor", opacity: ".2", stroke: "currentColor", strokeWidth: "1.25" }),
    /* @__PURE__ */ c("path", { d: "M6 6l6 6M12 6l-6 6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  ] }) : /* @__PURE__ */ O("svg", { "aria-hidden": "true", className: t, viewBox: "0 0 18 18", fill: "none", children: [
    /* @__PURE__ */ c("circle", { cx: "9", cy: "9", r: "8", fill: "currentColor", opacity: ".2", stroke: "currentColor", strokeWidth: "1.25" }),
    /* @__PURE__ */ c("path", { d: "M9 8v5M9 5.5h.01", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
  ] });
}, Vf = Fe(
  [
    "flex items-start gap-[var(--ds-component-alert-gap)]",
    "rounded-[var(--ds-component-alert-radius)]",
    "px-[var(--ds-component-alert-padding-x)]",
    "py-[var(--ds-component-alert-padding-y)]",
    "border-l-[length:var(--ds-component-alert-border-width)] border-l-4",
    "text-sm"
  ],
  {
    variants: {
      intent: {
        info: "bg-[var(--ds-component-alert-info-bg)]    text-[color:var(--ds-component-alert-info-text)]    border-l-[color:var(--ds-component-alert-info-border)]    [--alert-icon:var(--ds-component-alert-info-icon)]",
        success: "bg-[var(--ds-component-alert-success-bg)] text-[color:var(--ds-component-alert-success-text)] border-l-[color:var(--ds-component-alert-success-border)] [--alert-icon:var(--ds-component-alert-success-icon)]",
        warning: "bg-[var(--ds-component-alert-warning-bg)] text-[color:var(--ds-component-alert-warning-text)] border-l-[color:var(--ds-component-alert-warning-border)] [--alert-icon:var(--ds-component-alert-warning-icon)]",
        danger: "bg-[var(--ds-component-alert-danger-bg)]  text-[color:var(--ds-component-alert-danger-text)]  border-l-[color:var(--ds-component-alert-danger-border)]  [--alert-icon:var(--ds-component-alert-danger-icon)]"
      }
    },
    defaultVariants: {
      intent: "info"
    }
  }
), Uf = s.forwardRef(
  ({ children: e, intent: t = "info", title: o, dismissible: r = !1, onDismiss: n, className: a, ...l }, i) => {
    const u = t === "danger" || t === "warning";
    return /* @__PURE__ */ O(
      "div",
      {
        ref: i,
        role: u ? "alert" : "status",
        "aria-live": u ? "assertive" : "polite",
        "aria-atomic": "true",
        className: S(Vf({ intent: t }), a),
        ...l,
        children: [
          /* @__PURE__ */ c("span", { style: { color: "var(--alert-icon)" }, children: /* @__PURE__ */ c(Gf, { intent: t ?? "info" }) }),
          /* @__PURE__ */ O("div", { className: "flex-1 min-w-0", children: [
            o && /* @__PURE__ */ c("p", { className: "font-semibold mb-0.5 leading-snug", children: o }),
            /* @__PURE__ */ c("div", { className: "leading-relaxed", children: e })
          ] }),
          r && /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              "aria-label": "Dismiss alert",
              onClick: n,
              className: S(
                "shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100",
                "transition-opacity duration-[150ms]",
                "focus-visible:outline-none",
                "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
                "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
                "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]"
              ),
              children: /* @__PURE__ */ c("svg", { "aria-hidden": "true", width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: /* @__PURE__ */ c("path", { d: "M2 2l10 10M12 2L2 12", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
            }
          )
        ]
      }
    );
  }
);
Uf.displayName = "Alert";
const pr = {
  sm: "w-4 h-4",
  md: "w-[var(--ds-component-checkbox-size)] h-[var(--ds-component-checkbox-size)]"
}, Kf = s.forwardRef(
  ({
    children: e,
    indeterminate: t = !1,
    size: o = "md",
    disabled: r,
    onChange: n,
    className: a,
    id: l,
    ...i
  }, u) => {
    const p = s.useRef(null);
    s.useImperativeHandle(u, () => p.current, []);
    const f = s.useId(), d = l ?? f;
    s.useEffect(() => {
      p.current && (p.current.indeterminate = t);
    }, [t]);
    const v = (h) => {
      n == null || n(h.target.checked);
    };
    return /* @__PURE__ */ O(
      "label",
      {
        htmlFor: d,
        className: S(
          "inline-flex items-center gap-2 select-none",
          r ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          a
        ),
        children: [
          /* @__PURE__ */ O("span", { className: "relative inline-flex shrink-0 items-center justify-center", children: [
            /* @__PURE__ */ c(
              "input",
              {
                ref: p,
                id: d,
                type: "checkbox",
                disabled: r,
                onChange: v,
                className: S(
                  "peer appearance-none shrink-0 cursor-pointer",
                  pr[o],
                  "rounded-[var(--ds-component-checkbox-radius)]",
                  "border border-[color:var(--ds-component-checkbox-border)]",
                  "bg-transparent",
                  "transition-[background-color,border-color] duration-[100ms]",
                  "checked:bg-[var(--ds-component-checkbox-bg-checked)]",
                  "checked:border-[color:var(--ds-component-checkbox-bg-checked)]",
                  "indeterminate:bg-[var(--ds-component-checkbox-bg-checked)]",
                  "indeterminate:border-[color:var(--ds-component-checkbox-bg-checked)]",
                  // Focus ring
                  "focus-visible:outline-none",
                  "focus-visible:ring-[length:var(--ds-focus-ring-width)]",
                  "focus-visible:ring-[color:var(--ds-focus-ring-color)]",
                  "focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]",
                  r && "pointer-events-none"
                ),
                ...i
              }
            ),
            /* @__PURE__ */ c(
              "svg",
              {
                "aria-hidden": "true",
                className: S(
                  "pointer-events-none absolute opacity-0",
                  "text-[color:var(--ds-component-checkbox-icon-checked)]",
                  "peer-checked:opacity-100 peer-indeterminate:opacity-0",
                  "transition-opacity duration-[100ms]",
                  pr[o]
                ),
                viewBox: "0 0 16 16",
                fill: "none",
                children: /* @__PURE__ */ c("path", { d: "M3.5 8l3 3 6-6", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" })
              }
            ),
            /* @__PURE__ */ c(
              "svg",
              {
                "aria-hidden": "true",
                className: S(
                  "pointer-events-none absolute opacity-0",
                  "text-[color:var(--ds-component-checkbox-icon-checked)]",
                  "peer-indeterminate:opacity-100",
                  "transition-opacity duration-[100ms]",
                  pr[o]
                ),
                viewBox: "0 0 16 16",
                fill: "none",
                children: /* @__PURE__ */ c("path", { d: "M4 8h8", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round" })
              }
            )
          ] }),
          e && /* @__PURE__ */ c("span", { className: "text-sm leading-snug", children: e })
        ]
      }
    );
  }
);
Kf.displayName = "Checkbox";
const jf = s.forwardRef(
  ({ label: e, children: t, className: o }, r) => /* @__PURE__ */ O("div", { ref: r, className: S("flex flex-col gap-1", o), children: [
    e && /* @__PURE__ */ c(
      "p",
      {
        className: S(
          "px-[var(--ds-component-navigation-item-padding-x)]",
          "text-[length:var(--ds-font-size-xs)]",
          "font-[var(--ds-font-weight-semibold)]",
          "tracking-[var(--ds-font-letter-spacing-widest)]",
          "uppercase",
          "text-[color:var(--ds-theme-content-subtle)]",
          "select-none",
          "mb-1"
        ),
        children: e
      }
    ),
    t
  ] })
);
jf.displayName = "NavGroup";
const Yf = s.forwardRef(
  ({ label: e, htmlFor: t, helpText: o, errorText: r, children: n, className: a }, l) => /* @__PURE__ */ O("div", { ref: l, className: S("flex flex-col gap-[var(--ds-spacing-1)]", a), children: [
    /* @__PURE__ */ c(
      "label",
      {
        htmlFor: t,
        className: "text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[color:var(--ds-theme-content-strong)] leading-none",
        children: e
      }
    ),
    n,
    r && /* @__PURE__ */ c("p", { className: "text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-intent-danger-strong)] leading-snug", children: r }),
    !r && o && /* @__PURE__ */ c("p", { className: "text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] leading-snug", children: o })
  ] })
);
Yf.displayName = "FormField";
const Xf = s.forwardRef(
  ({ className: e, children: t, disabled: o, required: r, ...n }, a) => /* @__PURE__ */ O(
    "label",
    {
      ref: a,
      className: S(
        "text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[color:var(--ds-theme-content-strong)] leading-none select-none",
        o && "cursor-not-allowed opacity-50",
        !o && "cursor-pointer",
        e
      ),
      ...n,
      children: [
        t,
        r && /* @__PURE__ */ c("span", { className: "text-[color:var(--ds-theme-intent-danger-strong)] ml-[var(--ds-spacing-half)]", "aria-hidden": "true", children: "*" })
      ]
    }
  )
);
Xf.displayName = "Label";
const qf = s.forwardRef(
  ({ className: e, disabled: t, invalid: o = !1, ...r }, n) => /* @__PURE__ */ c(
    "textarea",
    {
      ref: n,
      disabled: t,
      "aria-invalid": o || void 0,
      className: S(
        "flex min-h-[80px] w-full bg-[var(--ds-component-input-bg)] text-[color:var(--ds-component-input-text)] text-sm",
        "rounded-[var(--ds-component-input-radius)]",
        "border transition-[border-color,box-shadow] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        "px-[var(--ds-component-input-padding-x)] py-[var(--ds-spacing-3)]",
        "placeholder:text-[color:var(--ds-component-input-placeholder)]",
        // Border states
        !o && [
          "border-[var(--ds-component-input-border)]",
          "hover:border-[var(--ds-component-input-border-hover)]"
        ],
        o && "border-[var(--ds-component-input-border-error)]",
        // Focus states
        "focus-visible:outline-none",
        "focus-visible:border-[var(--ds-component-input-border-focus)]",
        "focus-visible:shadow-[var(--ds-component-input-shadow-focus)]",
        // Disabled state
        t && "bg-[var(--ds-component-input-bg-disabled)] pointer-events-none opacity-50",
        e
      ),
      ...r
    }
  )
);
qf.displayName = "Textarea";
function N(e, t, { checkForDefaultPrevented: o = !0 } = {}) {
  return function(n) {
    if (e == null || e(n), o === !1 || !n.defaultPrevented)
      return t == null ? void 0 : t(n);
  };
}
function ua(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function Kr(...e) {
  return (t) => {
    let o = !1;
    const r = e.map((n) => {
      const a = ua(n, t);
      return !o && typeof a == "function" && (o = !0), a;
    });
    if (o)
      return () => {
        for (let n = 0; n < r.length; n++) {
          const a = r[n];
          typeof a == "function" ? a() : ua(e[n], null);
        }
      };
  };
}
function L(...e) {
  return s.useCallback(Kr(...e), e);
}
function J(e, t = []) {
  let o = [];
  function r(a, l) {
    const i = s.createContext(l);
    i.displayName = a + "Context";
    const u = o.length;
    o = [...o, l];
    const p = (d) => {
      var w;
      const { scope: v, children: h, ...g } = d, m = ((w = v == null ? void 0 : v[e]) == null ? void 0 : w[u]) || i, b = s.useMemo(() => g, Object.values(g));
      return /* @__PURE__ */ c(m.Provider, { value: b, children: h });
    };
    p.displayName = a + "Provider";
    function f(d, v) {
      var m;
      const h = ((m = v == null ? void 0 : v[e]) == null ? void 0 : m[u]) || i, g = s.useContext(h);
      if (g) return g;
      if (l !== void 0) return l;
      throw new Error(`\`${d}\` must be used within \`${a}\``);
    }
    return [p, f];
  }
  const n = () => {
    const a = o.map((l) => s.createContext(l));
    return function(i) {
      const u = (i == null ? void 0 : i[e]) || a;
      return s.useMemo(
        () => ({ [`__scope${e}`]: { ...i, [e]: u } }),
        [i, u]
      );
    };
  };
  return n.scopeName = e, [r, Zf(n, ...t)];
}
function Zf(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const o = () => {
    const r = e.map((n) => ({
      useScope: n(),
      scopeName: n.scopeName
    }));
    return function(a) {
      const l = r.reduce((i, { useScope: u, scopeName: p }) => {
        const d = u(a)[`__scope${p}`];
        return { ...i, ...d };
      }, {});
      return s.useMemo(() => ({ [`__scope${t.scopeName}`]: l }), [l]);
    };
  };
  return o.scopeName = t.scopeName, o;
}
var re = globalThis != null && globalThis.document ? s.useLayoutEffect : () => {
}, Qf = s[" useInsertionEffect ".trim().toString()] || re;
function oe({
  prop: e,
  defaultProp: t,
  onChange: o = () => {
  },
  caller: r
}) {
  const [n, a, l] = Jf({
    defaultProp: t,
    onChange: o
  }), i = e !== void 0, u = i ? e : n;
  {
    const f = s.useRef(e !== void 0);
    s.useEffect(() => {
      const d = f.current;
      d !== i && console.warn(
        `${r} is changing from ${d ? "controlled" : "uncontrolled"} to ${i ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), f.current = i;
    }, [i, r]);
  }
  const p = s.useCallback(
    (f) => {
      var d;
      if (i) {
        const v = ep(f) ? f(e) : f;
        v !== e && ((d = l.current) == null || d.call(l, v));
      } else
        a(f);
    },
    [i, e, a, l]
  );
  return [u, p];
}
function Jf({
  defaultProp: e,
  onChange: t
}) {
  const [o, r] = s.useState(e), n = s.useRef(o), a = s.useRef(t);
  return Qf(() => {
    a.current = t;
  }, [t]), s.useEffect(() => {
    var l;
    n.current !== o && ((l = a.current) == null || l.call(a, o), n.current = o);
  }, [o, n]), [o, r, a];
}
function ep(e) {
  return typeof e == "function";
}
function Ao(e) {
  const t = s.useRef({ value: e, previous: e });
  return s.useMemo(() => (t.current.value !== e && (t.current.previous = t.current.value, t.current.value = e), t.current.previous), [e]);
}
function _o(e) {
  const [t, o] = s.useState(void 0);
  return re(() => {
    if (e) {
      o({ width: e.offsetWidth, height: e.offsetHeight });
      const r = new ResizeObserver((n) => {
        if (!Array.isArray(n) || !n.length)
          return;
        const a = n[0];
        let l, i;
        if ("borderBoxSize" in a) {
          const u = a.borderBoxSize, p = Array.isArray(u) ? u[0] : u;
          l = p.inlineSize, i = p.blockSize;
        } else
          l = e.offsetWidth, i = e.offsetHeight;
        o({ width: l, height: i });
      });
      return r.observe(e, { box: "border-box" }), () => r.unobserve(e);
    } else
      o(void 0);
  }, [e]), t;
}
// @__NO_SIDE_EFFECTS__
function Ge(e) {
  const t = s.forwardRef((o, r) => {
    let { children: n, ...a } = o, l = null, i = !1;
    const u = [];
    da(n) && typeof eo == "function" && (n = eo(n._payload)), s.Children.forEach(n, (v) => {
      var h;
      if (sp(v)) {
        i = !0;
        const g = v;
        let m = "child" in g.props ? g.props.child : g.props.children;
        da(m) && typeof eo == "function" && (m = eo(m._payload)), l = rp(g, m), u.push((h = l == null ? void 0 : l.props) == null ? void 0 : h.children);
      } else
        u.push(v);
    }), l ? l = s.cloneElement(l, void 0, u) : (
      // A `Slottable` was found but it didn't resolve to a single element (e.g.
      // it wrapped multiple elements, text, or a render-prop `child` that
      // wasn't an element). Don't fall back to treating the `Slottable` wrapper
      // itself as the slot target — throw a descriptive error below instead.
      !i && s.Children.count(n) === 1 && s.isValidElement(n) && (l = n)
    );
    const p = l ? ap(l) : void 0, f = L(r, p);
    if (!l) {
      if (n || n === 0)
        throw new Error(
          i ? up(e) : cp(e)
        );
      return n;
    }
    const d = np(a, l.props ?? {});
    return l.type !== s.Fragment && (d.ref = r ? f : p), s.cloneElement(l, d);
  });
  return t.displayName = `${e}.Slot`, t;
}
var tp = /* @__PURE__ */ Ge("Slot"), es = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function op(e) {
  const t = (o) => "child" in o ? o.children(o.child) : o.children;
  return t.displayName = `${e}.Slottable`, t.__radixId = es, t;
}
var rp = (e, t) => {
  if ("child" in e.props) {
    const o = e.props.child;
    return s.isValidElement(o) ? s.cloneElement(o, void 0, e.props.children(o.props.children)) : null;
  }
  return s.isValidElement(t) ? t : null;
};
function np(e, t) {
  const o = { ...t };
  for (const r in t) {
    const n = e[r], a = t[r];
    /^on[A-Z]/.test(r) ? n && a ? o[r] = (...i) => {
      const u = a(...i);
      return n(...i), u;
    } : n && (o[r] = n) : r === "style" ? o[r] = { ...n, ...a } : r === "className" && (o[r] = [n, a].filter(Boolean).join(" "));
  }
  return { ...e, ...o };
}
function ap(e) {
  var r, n;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, o = t && "isReactWarning" in t && t.isReactWarning;
  return o ? e.ref : (t = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, o = t && "isReactWarning" in t && t.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
function sp(e) {
  return s.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === es;
}
var lp = Symbol.for("react.lazy");
function da(e) {
  return e != null && typeof e == "object" && "$$typeof" in e && e.$$typeof === lp && "_payload" in e && ip(e._payload);
}
function ip(e) {
  return typeof e == "object" && e !== null && "then" in e;
}
var cp = (e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, up = (e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, eo = s[" use ".trim().toString()], dp = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], M = dp.reduce((e, t) => {
  const o = /* @__PURE__ */ Ge(`Primitive.${t}`), r = s.forwardRef((n, a) => {
    const { asChild: l, ...i } = n, u = l ? o : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ c(u, { ...i, ref: a });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function ts(e, t) {
  e && Ft.flushSync(() => e.dispatchEvent(t));
}
var To = "Switch", [fp] = J(To), [pp, jr] = fp(To);
function vp(e) {
  const {
    __scopeSwitch: t,
    checked: o,
    children: r,
    defaultChecked: n,
    disabled: a,
    form: l,
    name: i,
    onCheckedChange: u,
    required: p,
    value: f = "on",
    // @ts-expect-error
    internal_do_not_use_render: d
  } = e, [v, h] = oe({
    prop: o,
    defaultProp: n ?? !1,
    onChange: u,
    caller: To
  }), [g, m] = s.useState(null), [b, w] = s.useState(null), y = s.useRef(!1), x = g ? !!l || !!g.closest("form") : (
    // We set this to true by default so that events bubble to forms without JS (SSR)
    !0
  ), C = {
    checked: v,
    setChecked: h,
    disabled: a,
    control: g,
    setControl: m,
    name: i,
    form: l,
    value: f,
    hasConsumerStoppedPropagationRef: y,
    required: p,
    defaultChecked: n,
    isFormControl: x,
    bubbleInput: b,
    setBubbleInput: w
  };
  return /* @__PURE__ */ c(pp, { scope: t, ...C, children: mp(d) ? d(C) : r });
}
var os = "SwitchTrigger", rs = s.forwardRef(
  ({ __scopeSwitch: e, onClick: t, ...o }, r) => {
    const {
      value: n,
      disabled: a,
      checked: l,
      required: i,
      setControl: u,
      setChecked: p,
      hasConsumerStoppedPropagationRef: f,
      isFormControl: d,
      bubbleInput: v
    } = jr(os, e), h = L(r, u);
    return /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        role: "switch",
        "aria-checked": l,
        "aria-required": i,
        "data-state": is(l),
        "data-disabled": a ? "" : void 0,
        disabled: a,
        value: n,
        ...o,
        ref: h,
        onClick: N(t, (g) => {
          p((m) => !m), v && d && (f.current = g.isPropagationStopped(), f.current || g.stopPropagation());
        })
      }
    );
  }
);
rs.displayName = os;
var Yr = s.forwardRef(
  (e, t) => {
    const {
      __scopeSwitch: o,
      name: r,
      checked: n,
      defaultChecked: a,
      required: l,
      disabled: i,
      value: u,
      onCheckedChange: p,
      form: f,
      ...d
    } = e;
    return /* @__PURE__ */ c(
      vp,
      {
        __scopeSwitch: o,
        checked: n,
        defaultChecked: a,
        disabled: i,
        required: l,
        onCheckedChange: p,
        name: r,
        form: f,
        value: u,
        internal_do_not_use_render: ({ isFormControl: v }) => /* @__PURE__ */ O(Ee, { children: [
          /* @__PURE__ */ c(
            rs,
            {
              ...d,
              ref: t,
              __scopeSwitch: o
            }
          ),
          v && /* @__PURE__ */ c(
            ls,
            {
              __scopeSwitch: o
            }
          )
        ] })
      }
    );
  }
);
Yr.displayName = To;
var ns = "SwitchThumb", as = s.forwardRef(
  (e, t) => {
    const { __scopeSwitch: o, ...r } = e, n = jr(ns, o);
    return /* @__PURE__ */ c(
      M.span,
      {
        "data-state": is(n.checked),
        "data-disabled": n.disabled ? "" : void 0,
        ...r,
        ref: t
      }
    );
  }
);
as.displayName = ns;
var ss = "SwitchBubbleInput", ls = s.forwardRef(
  ({ __scopeSwitch: e, ...t }, o) => {
    const {
      control: r,
      hasConsumerStoppedPropagationRef: n,
      checked: a,
      defaultChecked: l,
      required: i,
      disabled: u,
      name: p,
      value: f,
      form: d,
      bubbleInput: v,
      setBubbleInput: h
    } = jr(ss, e), g = L(o, h), m = Ao(a), b = _o(r);
    s.useEffect(() => {
      const y = v;
      if (!y) return;
      const x = window.HTMLInputElement.prototype, R = Object.getOwnPropertyDescriptor(
        x,
        "checked"
      ).set, E = !n.current;
      if (m !== a && R) {
        const P = new Event("click", { bubbles: E });
        R.call(y, a), y.dispatchEvent(P);
      }
    }, [v, m, a, n]);
    const w = s.useRef(a);
    return /* @__PURE__ */ c(
      M.input,
      {
        type: "checkbox",
        "aria-hidden": !0,
        defaultChecked: l ?? w.current,
        required: i,
        disabled: u,
        name: p,
        value: f,
        form: d,
        ...t,
        tabIndex: -1,
        ref: g,
        style: {
          ...t.style,
          ...b,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0,
          // We transform because the input is absolutely positioned but we have
          // rendered it **after** the button. This pulls it back to sit on top
          // of the button.
          transform: "translateX(-100%)"
        }
      }
    );
  }
);
ls.displayName = ss;
function mp(e) {
  return typeof e == "function";
}
function is(e) {
  return e ? "checked" : "unchecked";
}
const hp = s.forwardRef(
  ({ className: e, ...t }, o) => /* @__PURE__ */ c(
    Yr,
    {
      ref: o,
      className: S(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-[var(--ds-component-switch-track-radius)] transition-colors duration-200 ease-in-out",
        "w-[var(--ds-component-switch-track-width)] h-[var(--ds-component-switch-track-height)]",
        // Background states: Off vs On
        "bg-[var(--ds-component-switch-track-bg-off)] data-[state=checked]:bg-[var(--ds-component-switch-track-bg-on)]",
        // Universal Focus styling matching design-system schema
        "focus-visible:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        e
      ),
      ...t,
      children: /* @__PURE__ */ c(
        as,
        {
          className: S(
            "pointer-events-none block rounded-full transition-transform duration-200 ease-in-out",
            "w-[var(--ds-component-switch-thumb-size)] h-[var(--ds-component-switch-thumb-size)]",
            "bg-[var(--ds-component-switch-thumb-bg)] shadow-[var(--ds-component-switch-thumb-shadow)]",
            // Position translation: 2px padding when off, 22px when on (44px total width - 20px thumb - 2px padding = 22px)
            "translate-x-[2px] data-[state=checked]:translate-x-[22px]"
          )
        }
      )
    }
  )
);
hp.displayName = Yr.displayName;
function yt(e) {
  const t = e + "CollectionProvider", [o, r] = J(t), [n, a] = o(
    t,
    { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
  ), l = (m) => {
    const { scope: b, children: w } = m, y = s.useRef(null), x = s.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ c(n, { scope: b, itemMap: x, collectionRef: y, children: w });
  };
  l.displayName = t;
  const i = e + "CollectionSlot", u = /* @__PURE__ */ Ge(i), p = s.forwardRef(
    (m, b) => {
      const { scope: w, children: y } = m, x = a(i, w), C = L(b, x.collectionRef);
      return /* @__PURE__ */ c(u, { ref: C, children: y });
    }
  );
  p.displayName = i;
  const f = e + "CollectionItemSlot", d = "data-radix-collection-item", v = /* @__PURE__ */ Ge(f), h = s.forwardRef(
    (m, b) => {
      const { scope: w, children: y, ...x } = m, C = s.useRef(null), R = L(b, C), E = a(f, w);
      return s.useEffect(() => (E.itemMap.set(C, { ref: C, ...x }), () => void E.itemMap.delete(C))), /* @__PURE__ */ c(v, { [d]: "", ref: R, children: y });
    }
  );
  h.displayName = f;
  function g(m) {
    const b = a(e + "CollectionConsumer", m);
    return s.useCallback(() => {
      const y = b.collectionRef.current;
      if (!y) return [];
      const x = Array.from(y.querySelectorAll(`[${d}]`));
      return Array.from(b.itemMap.values()).sort(
        (E, P) => x.indexOf(E.ref.current) - x.indexOf(P.ref.current)
      );
    }, [b.collectionRef, b.itemMap]);
  }
  return [
    { Provider: l, Slot: p, ItemSlot: h },
    g,
    r
  ];
}
var gp = s[" useId ".trim().toString()] || (() => {
}), bp = 0;
function ne(e) {
  const [t, o] = s.useState(gp());
  return re(() => {
    o((r) => r ?? String(bp++));
  }, [e]), t ? `radix-${t}` : "";
}
function ae(e) {
  const t = s.useRef(e);
  return s.useEffect(() => {
    t.current = e;
  }), s.useMemo(() => ((...o) => {
    var r;
    return (r = t.current) == null ? void 0 : r.call(t, ...o);
  }), []);
}
var yp = s.createContext(void 0);
function Pe(e) {
  const t = s.useContext(yp);
  return e || t || "ltr";
}
var vr = "rovingFocusGroup.onEntryFocus", wp = { bubbles: !1, cancelable: !0 }, Lt = "RovingFocusGroup", [Er, cs, xp] = yt(Lt), [Cp, Ae] = J(
  Lt,
  [xp]
), [Sp, Rp] = Cp(Lt), us = s.forwardRef(
  (e, t) => /* @__PURE__ */ c(Er.Provider, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ c(Er.Slot, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ c(Np, { ...e, ref: t }) }) })
);
us.displayName = Lt;
var Np = s.forwardRef((e, t) => {
  const {
    __scopeRovingFocusGroup: o,
    orientation: r,
    loop: n = !1,
    dir: a,
    currentTabStopId: l,
    defaultCurrentTabStopId: i,
    onCurrentTabStopIdChange: u,
    onEntryFocus: p,
    preventScrollOnEntryFocus: f = !1,
    ...d
  } = e, v = s.useRef(null), h = L(t, v), g = Pe(a), [m, b] = oe({
    prop: l,
    defaultProp: i ?? null,
    onChange: u,
    caller: Lt
  }), [w, y] = s.useState(!1), x = ae(p), C = cs(o), R = s.useRef(!1), [E, P] = s.useState(0);
  return s.useEffect(() => {
    const I = v.current;
    if (I)
      return I.addEventListener(vr, x), () => I.removeEventListener(vr, x);
  }, [x]), /* @__PURE__ */ c(
    Sp,
    {
      scope: o,
      orientation: r,
      dir: g,
      loop: n,
      currentTabStopId: m,
      onItemFocus: s.useCallback(
        (I) => b(I),
        [b]
      ),
      onItemShiftTab: s.useCallback(() => y(!0), []),
      onFocusableItemAdd: s.useCallback(
        () => P((I) => I + 1),
        []
      ),
      onFocusableItemRemove: s.useCallback(
        () => P((I) => I - 1),
        []
      ),
      children: /* @__PURE__ */ c(
        M.div,
        {
          tabIndex: w || E === 0 ? -1 : 0,
          "data-orientation": r,
          ...d,
          ref: h,
          style: { outline: "none", ...e.style },
          onMouseDown: N(e.onMouseDown, () => {
            R.current = !0;
          }),
          onFocus: N(e.onFocus, (I) => {
            const _ = !R.current;
            if (I.target === I.currentTarget && _ && !w) {
              const D = new CustomEvent(vr, wp);
              if (I.currentTarget.dispatchEvent(D), !D.defaultPrevented) {
                const F = C().filter((z) => z.focusable), T = F.find((z) => z.active), H = F.find((z) => z.id === m), U = [T, H, ...F].filter(
                  Boolean
                ).map((z) => z.ref.current);
                ps(U, f);
              }
            }
            R.current = !1;
          }),
          onBlur: N(e.onBlur, () => y(!1))
        }
      )
    }
  );
}), ds = "RovingFocusGroupItem", fs = s.forwardRef(
  (e, t) => {
    const {
      __scopeRovingFocusGroup: o,
      focusable: r = !0,
      active: n = !1,
      tabStopId: a,
      children: l,
      ...i
    } = e, u = ne(), p = a || u, f = Rp(ds, o), d = f.currentTabStopId === p, v = cs(o), { onFocusableItemAdd: h, onFocusableItemRemove: g, currentTabStopId: m } = f;
    return s.useEffect(() => {
      if (r)
        return h(), () => g();
    }, [r, h, g]), /* @__PURE__ */ c(
      Er.ItemSlot,
      {
        scope: o,
        id: p,
        focusable: r,
        active: n,
        children: /* @__PURE__ */ c(
          M.span,
          {
            tabIndex: d ? 0 : -1,
            "data-orientation": f.orientation,
            ...i,
            ref: t,
            onMouseDown: N(e.onMouseDown, (b) => {
              r ? f.onItemFocus(p) : b.preventDefault();
            }),
            onFocus: N(e.onFocus, () => f.onItemFocus(p)),
            onKeyDown: N(e.onKeyDown, (b) => {
              if (b.key === "Tab" && b.shiftKey) {
                f.onItemShiftTab();
                return;
              }
              if (b.target !== b.currentTarget) return;
              const w = Ap(b, f.orientation, f.dir);
              if (w !== void 0) {
                if (b.metaKey || b.ctrlKey || b.altKey || b.shiftKey) return;
                b.preventDefault();
                let x = v().filter((C) => C.focusable).map((C) => C.ref.current);
                if (w === "last") x.reverse();
                else if (w === "prev" || w === "next") {
                  w === "prev" && x.reverse();
                  const C = x.indexOf(b.currentTarget);
                  x = f.loop ? _p(x, C + 1) : x.slice(C + 1);
                }
                setTimeout(() => ps(x));
              }
            }),
            children: typeof l == "function" ? l({ isCurrentTabStop: d, hasTabStop: m != null }) : l
          }
        )
      }
    );
  }
);
fs.displayName = ds;
var Ep = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function Pp(e, t) {
  return t !== "rtl" ? e : e === "ArrowLeft" ? "ArrowRight" : e === "ArrowRight" ? "ArrowLeft" : e;
}
function Ap(e, t, o) {
  const r = Pp(e.key, o);
  if (!(t === "vertical" && ["ArrowLeft", "ArrowRight"].includes(r)) && !(t === "horizontal" && ["ArrowUp", "ArrowDown"].includes(r)))
    return Ep[r];
}
function ps(e, t = !1) {
  const o = document.activeElement;
  for (const r of e)
    if (r === o || (r.focus({ preventScroll: t }), document.activeElement !== o)) return;
}
function _p(e, t) {
  return e.map((o, r) => e[(t + r) % e.length]);
}
var $t = us, zt = fs;
function Tp(e, t) {
  return s.useReducer((o, r) => t[o][r] ?? o, e);
}
var ee = (e) => {
  const { present: t, children: o } = e, r = Mp(t), n = typeof o == "function" ? o({ present: r.isPresent }) : s.Children.only(o), a = Ip(r.ref, Dp(n));
  return typeof o == "function" || r.isPresent ? s.cloneElement(n, { ref: a }) : null;
};
ee.displayName = "Presence";
function Mp(e) {
  const [t, o] = s.useState(), r = s.useRef(null), n = s.useRef(e), a = s.useRef("none"), l = e ? "mounted" : "unmounted", [i, u] = Tp(l, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return s.useEffect(() => {
    const p = to(r.current);
    a.current = i === "mounted" ? p : "none";
  }, [i]), re(() => {
    const p = r.current, f = n.current;
    if (f !== e) {
      const v = a.current, h = to(p);
      e ? u("MOUNT") : h === "none" || (p == null ? void 0 : p.display) === "none" ? u("UNMOUNT") : u(f && v !== h ? "ANIMATION_OUT" : "UNMOUNT"), n.current = e;
    }
  }, [e, u]), re(() => {
    if (t) {
      let p;
      const f = t.ownerDocument.defaultView ?? window, d = (h) => {
        const m = to(r.current).includes(CSS.escape(h.animationName));
        if (h.target === t && m && (u("ANIMATION_END"), !n.current)) {
          const b = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", p = f.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = b);
          });
        }
      }, v = (h) => {
        h.target === t && (a.current = to(r.current));
      };
      return t.addEventListener("animationstart", v), t.addEventListener("animationcancel", d), t.addEventListener("animationend", d), () => {
        f.clearTimeout(p), t.removeEventListener("animationstart", v), t.removeEventListener("animationcancel", d), t.removeEventListener("animationend", d);
      };
    } else
      u("ANIMATION_END");
  }, [t, u]), {
    isPresent: ["mounted", "unmountSuspended"].includes(i),
    ref: s.useCallback((p) => {
      r.current = p ? getComputedStyle(p) : null, o(p);
    }, [])
  };
}
function fa(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function Ip(...e) {
  const t = s.useRef(e);
  return t.current = e, s.useCallback((o) => {
    const r = t.current;
    let n = !1;
    const a = r.map((l) => {
      const i = fa(l, o);
      return !n && typeof i == "function" && (n = !0), i;
    });
    if (n)
      return () => {
        for (let l = 0; l < a.length; l++) {
          const i = a[l];
          typeof i == "function" ? i() : fa(r[l], null);
        }
      };
  }, []);
}
function to(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function Dp(e) {
  var r, n;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, o = t && "isReactWarning" in t && t.isReactWarning;
  return o ? e.ref : (t = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, o = t && "isReactWarning" in t && t.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var Xr = "Radio", [kp, vs] = J(Xr), [Op, Mo] = kp(Xr);
function ms(e) {
  const {
    __scopeRadio: t,
    checked: o = !1,
    children: r,
    disabled: n,
    form: a,
    name: l,
    onCheck: i,
    required: u,
    value: p = "on",
    // @ts-expect-error
    internal_do_not_use_render: f
  } = e, [d, v] = s.useState(null), [h, g] = s.useState(null), m = s.useRef(!1), b = d ? !!a || !!d.closest("form") : (
    // We set this to true by default so that events bubble to forms without JS (SSR)
    !0
  ), w = {
    checked: o,
    disabled: n,
    required: u,
    name: l,
    form: a,
    value: p,
    control: d,
    setControl: v,
    hasConsumerStoppedPropagationRef: m,
    isFormControl: b,
    bubbleInput: h,
    setBubbleInput: g,
    onCheck: () => i == null ? void 0 : i()
  };
  return /* @__PURE__ */ c(Op, { scope: t, ...w, children: Lp(f) ? f(w) : r });
}
var hs = "RadioTrigger", qr = s.forwardRef(
  ({ __scopeRadio: e, onClick: t, ...o }, r) => {
    const {
      checked: n,
      disabled: a,
      value: l,
      setControl: i,
      onCheck: u,
      hasConsumerStoppedPropagationRef: p,
      isFormControl: f,
      bubbleInput: d
    } = Mo(hs, e), v = L(r, i);
    return /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        role: "radio",
        "aria-checked": n,
        "data-state": ws(n),
        "data-disabled": a ? "" : void 0,
        disabled: a,
        value: l,
        ...o,
        ref: v,
        onClick: N(t, (h) => {
          n || u(), d && f && (p.current = h.isPropagationStopped(), p.current || h.stopPropagation());
        })
      }
    );
  }
);
qr.displayName = hs;
var Fp = s.forwardRef(
  (e, t) => {
    const { __scopeRadio: o, name: r, checked: n, required: a, disabled: l, value: i, onCheck: u, form: p, ...f } = e;
    return /* @__PURE__ */ c(
      ms,
      {
        __scopeRadio: o,
        checked: n,
        disabled: l,
        required: a,
        onCheck: u,
        name: r,
        form: p,
        value: i,
        internal_do_not_use_render: ({ isFormControl: d }) => /* @__PURE__ */ O(Ee, { children: [
          /* @__PURE__ */ c(
            qr,
            {
              ...f,
              ref: t,
              __scopeRadio: o
            }
          ),
          d && /* @__PURE__ */ c(
            Zr,
            {
              __scopeRadio: o
            }
          )
        ] })
      }
    );
  }
);
Fp.displayName = Xr;
var gs = "RadioIndicator", bs = s.forwardRef(
  (e, t) => {
    const { __scopeRadio: o, forceMount: r, ...n } = e, a = Mo(gs, o);
    return /* @__PURE__ */ c(ee, { present: r || a.checked, children: /* @__PURE__ */ c(
      M.span,
      {
        "data-state": ws(a.checked),
        "data-disabled": a.disabled ? "" : void 0,
        ...n,
        ref: t
      }
    ) });
  }
);
bs.displayName = gs;
var ys = "RadioBubbleInput", Zr = s.forwardRef(
  ({ __scopeRadio: e, ...t }, o) => {
    const {
      control: r,
      checked: n,
      required: a,
      disabled: l,
      name: i,
      value: u,
      form: p,
      bubbleInput: f,
      setBubbleInput: d,
      hasConsumerStoppedPropagationRef: v
    } = Mo(ys, e), h = L(o, d), g = Ao(n), m = _o(r);
    s.useEffect(() => {
      const w = f;
      if (!w) return;
      const y = window.HTMLInputElement.prototype, C = Object.getOwnPropertyDescriptor(
        y,
        "checked"
      ).set, R = !v.current;
      if (g !== n && C) {
        const E = new Event("click", { bubbles: R });
        C.call(w, n), w.dispatchEvent(E);
      }
    }, [f, g, n, v]);
    const b = s.useRef(n);
    return /* @__PURE__ */ c(
      M.input,
      {
        type: "radio",
        "aria-hidden": !0,
        defaultChecked: b.current,
        required: a,
        disabled: l,
        name: i,
        value: u,
        form: p,
        ...t,
        tabIndex: -1,
        ref: h,
        style: {
          ...t.style,
          ...m,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0,
          // We transform because the input is absolutely positioned but we have
          // rendered it **after** the button. This pulls it back to sit on top
          // of the button.
          transform: "translateX(-100%)"
        }
      }
    );
  }
);
Zr.displayName = ys;
function Lp(e) {
  return typeof e == "function";
}
function ws(e) {
  return e ? "checked" : "unchecked";
}
var $p = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], Io = "RadioGroup", [zp] = J(Io, [
  Ae,
  vs
]), xs = Ae(), Do = vs(), [Bp, Hp] = zp(Io), Qr = s.forwardRef(
  (e, t) => {
    const {
      __scopeRadioGroup: o,
      name: r,
      defaultValue: n,
      value: a,
      required: l = !1,
      disabled: i = !1,
      orientation: u,
      dir: p,
      loop: f = !0,
      onValueChange: d,
      ...v
    } = e, h = xs(o), g = Pe(p), [m, b] = oe({
      prop: a,
      defaultProp: n ?? null,
      onChange: d,
      caller: Io
    });
    return /* @__PURE__ */ c(
      Bp,
      {
        scope: o,
        name: r,
        required: l,
        disabled: i,
        value: m,
        onValueChange: b,
        children: /* @__PURE__ */ c(
          $t,
          {
            asChild: !0,
            ...h,
            orientation: u,
            dir: g,
            loop: f,
            children: /* @__PURE__ */ c(
              M.div,
              {
                role: "radiogroup",
                "aria-required": l,
                "aria-orientation": u,
                "data-disabled": i ? "" : void 0,
                dir: g,
                ...v,
                ref: t
              }
            )
          }
        )
      }
    );
  }
);
Qr.displayName = Io;
var Wp = "RadioGroupItem", Gp = "RadioGroupItemProvider", Cs = "RadioGroupItemTrigger", Vp = "RadioGroupItemBubbleInput";
function Up(e) {
  const {
    __scopeRadioGroup: t,
    value: o,
    disabled: r,
    children: n,
    // @ts-expect-error
    internal_do_not_use_render: a
  } = e, l = Hp(Gp, t), i = Do(t), u = l.disabled || r;
  return /* @__PURE__ */ c(
    ms,
    {
      ...i,
      checked: l.value === o,
      disabled: u,
      required: l.required,
      name: l.name,
      value: o,
      onCheck: () => l.onValueChange(o),
      internal_do_not_use_render: a,
      children: n
    }
  );
}
var Ss = s.forwardRef((e, t) => {
  const { __scopeRadioGroup: o, ...r } = e, n = xs(o), a = Do(o), { checked: l, disabled: i } = Mo(Cs, a.__scopeRadio), u = s.useRef(null), p = L(t, u), f = s.useRef(!1);
  return s.useEffect(() => {
    const d = (h) => {
      $p.includes(h.key) && (f.current = !0);
    }, v = () => f.current = !1;
    return document.addEventListener("keydown", d), document.addEventListener("keyup", v), () => {
      document.removeEventListener("keydown", d), document.removeEventListener("keyup", v);
    };
  }, []), /* @__PURE__ */ c(
    zt,
    {
      asChild: !0,
      ...n,
      focusable: !i,
      active: l,
      children: /* @__PURE__ */ c(
        qr,
        {
          ...a,
          ...r,
          ref: p,
          onKeyDown: N(r.onKeyDown, (d) => {
            d.key === "Enter" && d.preventDefault();
          }),
          onFocus: N(r.onFocus, () => {
            var d;
            f.current && ((d = u.current) == null || d.click());
          })
        }
      )
    }
  );
});
Ss.displayName = Cs;
var Jr = s.forwardRef(
  (e, t) => {
    const { __scopeRadioGroup: o, value: r, disabled: n, ...a } = e;
    return /* @__PURE__ */ c(
      Up,
      {
        __scopeRadioGroup: o,
        value: r,
        disabled: n,
        internal_do_not_use_render: ({ isFormControl: l }) => /* @__PURE__ */ O(Ee, { children: [
          /* @__PURE__ */ c(
            Ss,
            {
              ...a,
              ref: t,
              __scopeRadioGroup: o
            }
          ),
          l && /* @__PURE__ */ c(
            Rs,
            {
              __scopeRadioGroup: o
            }
          )
        ] })
      }
    );
  }
);
Jr.displayName = Wp;
var Rs = s.forwardRef((e, t) => {
  const { __scopeRadioGroup: o, ...r } = e, n = Do(o);
  return /* @__PURE__ */ c(Zr, { ...n, ...r, ref: t });
});
Rs.displayName = Vp;
var Kp = "RadioGroupIndicator", Ns = s.forwardRef(
  (e, t) => {
    const { __scopeRadioGroup: o, ...r } = e, n = Do(o);
    return /* @__PURE__ */ c(bs, { ...n, ...r, ref: t });
  }
);
Ns.displayName = Kp;
const jp = s.forwardRef(
  ({ className: e, ...t }, o) => /* @__PURE__ */ c(
    Qr,
    {
      className: S("grid gap-[var(--ds-spacing-3)]", e),
      ...t,
      ref: o
    }
  )
);
jp.displayName = Qr.displayName;
const Yp = s.forwardRef(
  ({ className: e, ...t }, o) => /* @__PURE__ */ c(
    Jr,
    {
      ref: o,
      className: S(
        "aspect-square rounded-full border border-[color:var(--ds-component-checkbox-border)] text-[color:var(--ds-component-checkbox-bg-checked)]",
        "w-[var(--ds-component-checkbox-size)] h-[var(--ds-component-checkbox-size)]",
        "flex items-center justify-center cursor-pointer",
        // Focus state
        "focus:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]",
        // Checked border color
        "data-[state=checked]:border-[color:var(--ds-component-checkbox-bg-checked)]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        e
      ),
      ...t,
      children: /* @__PURE__ */ c(Ns, { className: "flex items-center justify-center", children: /* @__PURE__ */ c("span", { className: "w-2.5 h-2.5 rounded-full bg-current" }) })
    }
  )
);
Yp.displayName = Jr.displayName;
function Mt(e, [t, o]) {
  return Math.min(o, Math.max(t, e));
}
var Es = ["PageUp", "PageDown"], Ps = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], As = {
  "from-left": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-right": ["Home", "PageDown", "ArrowDown", "ArrowRight"],
  "from-bottom": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-top": ["Home", "PageDown", "ArrowUp", "ArrowLeft"]
}, wt = "Slider", [Pr, Xp, qp] = yt(wt), [en] = J(wt, [
  qp
]), [Zp, Bt] = en(wt), tn = s.forwardRef(
  (e, t) => {
    const {
      name: o,
      min: r = 0,
      max: n = 100,
      step: a = 1,
      orientation: l = "horizontal",
      disabled: i = !1,
      minStepsBetweenThumbs: u = 0,
      defaultValue: p = [r],
      value: f,
      onValueChange: d = () => {
      },
      onValueCommit: v = () => {
      },
      inverted: h = !1,
      form: g,
      ...m
    } = e, b = s.useRef(/* @__PURE__ */ new Set()), w = s.useRef(0), y = s.useRef(!1), C = l === "horizontal" ? Qp : Jp, [R = [], E] = oe({
      prop: f,
      defaultProp: p,
      onChange: (T) => {
        var B;
        (B = [...b.current][w.current]) == null || B.focus({
          preventScroll: !0,
          focusVisible: y.current
        }), y.current = !1, d(T);
      }
    }), P = s.useRef(R);
    function I(T) {
      const H = rv(R, T);
      F(T, H);
    }
    function _(T) {
      F(T, w.current);
    }
    function D() {
      const T = P.current[w.current];
      R[w.current] !== T && v(R);
    }
    function F(T, H, { commit: B } = { commit: !1 }) {
      const U = lv(a), z = iv(Math.round((T - r) / a) * a + r, U), G = Mt(z, [r, n]);
      E((k = []) => {
        const A = tv(k, G, H);
        if (sv(A, u * a)) {
          w.current = A.indexOf(G);
          const V = String(A) !== String(k);
          return V && B && v(A), V ? A : k;
        } else
          return k;
      });
    }
    return /* @__PURE__ */ c(
      Zp,
      {
        scope: e.__scopeSlider,
        name: o,
        disabled: i,
        min: r,
        max: n,
        valueIndexToChangeRef: w,
        thumbs: b.current,
        values: R,
        orientation: l,
        form: g,
        children: /* @__PURE__ */ c(Pr.Provider, { scope: e.__scopeSlider, children: /* @__PURE__ */ c(Pr.Slot, { scope: e.__scopeSlider, children: /* @__PURE__ */ c(
          C,
          {
            "aria-disabled": i,
            "data-disabled": i ? "" : void 0,
            ...m,
            ref: t,
            onPointerDown: N(m.onPointerDown, () => {
              i || (P.current = R, y.current = !1);
            }),
            min: r,
            max: n,
            inverted: h,
            onSlideStart: i ? void 0 : I,
            onSlideMove: i ? void 0 : _,
            onSlideEnd: i ? void 0 : D,
            onHomeKeyDown: () => {
              i || (y.current = !0, F(r, 0, { commit: !0 }));
            },
            onEndKeyDown: () => {
              i || (y.current = !0, F(n, R.length - 1, { commit: !0 }));
            },
            onStepKeyDown: ({ event: T, direction: H }) => {
              if (!i) {
                y.current = !0;
                const z = Es.includes(T.key) || T.shiftKey && Ps.includes(T.key) ? 10 : 1, G = w.current, k = R[G], A = a * z * H;
                F(k + A, G, { commit: !0 });
              }
            }
          }
        ) }) })
      }
    );
  }
);
tn.displayName = wt;
var [_s, Ts] = en(wt, {
  startEdge: "left",
  endEdge: "right",
  size: "width",
  direction: 1
}), Qp = s.forwardRef(
  (e, t) => {
    const {
      min: o,
      max: r,
      dir: n,
      inverted: a,
      onSlideStart: l,
      onSlideMove: i,
      onSlideEnd: u,
      onStepKeyDown: p,
      ...f
    } = e, [d, v] = s.useState(null), h = L(t, (x) => v(x)), g = s.useRef(void 0), m = Pe(n), b = m === "ltr", w = b && !a || !b && a;
    function y(x) {
      const C = g.current || d.getBoundingClientRect(), R = [0, C.width], P = on(R, w ? [o, r] : [r, o]);
      return g.current = C, P(x - C.left);
    }
    return /* @__PURE__ */ c(
      _s,
      {
        scope: e.__scopeSlider,
        startEdge: w ? "left" : "right",
        endEdge: w ? "right" : "left",
        direction: w ? 1 : -1,
        size: "width",
        children: /* @__PURE__ */ c(
          Ms,
          {
            dir: m,
            "data-orientation": "horizontal",
            ...f,
            ref: h,
            style: {
              ...f.style,
              "--radix-slider-thumb-transform": "translateX(-50%)"
            },
            onSlideStart: (x) => {
              const C = y(x.clientX);
              l == null || l(C);
            },
            onSlideMove: (x) => {
              const C = y(x.clientX);
              i == null || i(C);
            },
            onSlideEnd: () => {
              g.current = void 0, u == null || u();
            },
            onStepKeyDown: (x) => {
              const R = As[w ? "from-left" : "from-right"].includes(x.key);
              p == null || p({ event: x, direction: R ? -1 : 1 });
            }
          }
        )
      }
    );
  }
), Jp = s.forwardRef(
  (e, t) => {
    const {
      min: o,
      max: r,
      inverted: n,
      onSlideStart: a,
      onSlideMove: l,
      onSlideEnd: i,
      onStepKeyDown: u,
      ...p
    } = e, f = s.useRef(null), d = L(t, f), v = s.useRef(void 0), h = !n;
    function g(m) {
      const b = v.current || f.current.getBoundingClientRect(), w = [0, b.height], x = on(w, h ? [r, o] : [o, r]);
      return v.current = b, x(m - b.top);
    }
    return /* @__PURE__ */ c(
      _s,
      {
        scope: e.__scopeSlider,
        startEdge: h ? "bottom" : "top",
        endEdge: h ? "top" : "bottom",
        size: "height",
        direction: h ? 1 : -1,
        children: /* @__PURE__ */ c(
          Ms,
          {
            "data-orientation": "vertical",
            ...p,
            ref: d,
            style: {
              ...p.style,
              "--radix-slider-thumb-transform": "translateY(50%)"
            },
            onSlideStart: (m) => {
              const b = g(m.clientY);
              a == null || a(b);
            },
            onSlideMove: (m) => {
              const b = g(m.clientY);
              l == null || l(b);
            },
            onSlideEnd: () => {
              v.current = void 0, i == null || i();
            },
            onStepKeyDown: (m) => {
              const w = As[h ? "from-bottom" : "from-top"].includes(m.key);
              u == null || u({ event: m, direction: w ? -1 : 1 });
            }
          }
        )
      }
    );
  }
), Ms = s.forwardRef(
  (e, t) => {
    const {
      __scopeSlider: o,
      onSlideStart: r,
      onSlideMove: n,
      onSlideEnd: a,
      onHomeKeyDown: l,
      onEndKeyDown: i,
      onStepKeyDown: u,
      ...p
    } = e, f = Bt(wt, o);
    return /* @__PURE__ */ c(
      M.span,
      {
        ...p,
        ref: t,
        onKeyDown: N(e.onKeyDown, (d) => {
          d.key === "Home" ? (l(d), d.preventDefault()) : d.key === "End" ? (i(d), d.preventDefault()) : Es.concat(Ps).includes(d.key) && (u(d), d.preventDefault());
        }),
        onPointerDown: N(e.onPointerDown, (d) => {
          const v = d.target;
          v.setPointerCapture(d.pointerId), d.preventDefault(), f.thumbs.has(v) ? v.focus({ preventScroll: !0, focusVisible: !1 }) : r(d);
        }),
        onPointerMove: N(e.onPointerMove, (d) => {
          d.target.hasPointerCapture(d.pointerId) && n(d);
        }),
        onPointerUp: N(e.onPointerUp, (d) => {
          const v = d.target;
          v.hasPointerCapture(d.pointerId) && (v.releasePointerCapture(d.pointerId), a(d));
        })
      }
    );
  }
), Is = "SliderTrack", Ds = s.forwardRef(
  (e, t) => {
    const { __scopeSlider: o, ...r } = e, n = Bt(Is, o);
    return /* @__PURE__ */ c(
      M.span,
      {
        "data-disabled": n.disabled ? "" : void 0,
        "data-orientation": n.orientation,
        ...r,
        ref: t
      }
    );
  }
);
Ds.displayName = Is;
var Ar = "SliderRange", ks = s.forwardRef(
  (e, t) => {
    const { __scopeSlider: o, ...r } = e, n = Bt(Ar, o), a = Ts(Ar, o), l = s.useRef(null), i = L(t, l), u = n.values.length, p = n.values.map(
      (v) => Gs(v, n.min, n.max)
    ), f = u > 1 ? Math.min(...p) : 0, d = 100 - Math.max(...p);
    return /* @__PURE__ */ c(
      M.span,
      {
        "data-orientation": n.orientation,
        "data-disabled": n.disabled ? "" : void 0,
        ...r,
        ref: i,
        style: {
          ...e.style,
          [a.startEdge]: f + "%",
          [a.endEdge]: d + "%"
        }
      }
    );
  }
);
ks.displayName = Ar;
var Os = "SliderThumb", [ev, Fs] = en(Os), Ls = "SliderThumbProvider";
function $s(e) {
  const {
    __scopeSlider: t,
    name: o,
    children: r,
    // @ts-expect-error internal render prop
    internal_do_not_use_render: n
  } = e, a = Bt(Ls, t), l = Xp(t), [i, u] = s.useState(null), p = s.useMemo(
    () => i ? l().findIndex((b) => b.ref.current === i) : -1,
    [l, i]
  ), f = _o(i), d = i ? !!a.form || !!i.closest("form") : !0, v = a.values[p], h = o ?? (a.name ? a.name + (a.values.length > 1 ? "[]" : "") : void 0), g = v === void 0 ? 0 : Gs(v, a.min, a.max);
  s.useEffect(() => {
    if (i)
      return a.thumbs.add(i), () => {
        a.thumbs.delete(i);
      };
  }, [i, a.thumbs]);
  const m = {
    value: v,
    name: h,
    form: a.form,
    isFormControl: d,
    index: p,
    thumb: i,
    onThumbChange: u,
    percent: g,
    size: f
  };
  return /* @__PURE__ */ c(ev, { scope: t, ...m, children: cv(n) ? n(m) : r });
}
$s.displayName = Ls;
var io = "SliderThumbTrigger", zs = s.forwardRef(
  (e, t) => {
    const { __scopeSlider: o, ...r } = e, n = Bt(io, o), a = Ts(io, o), { index: l, value: i, percent: u, size: p, onThumbChange: f } = Fs(
      io,
      o
    ), d = L(t, (m) => f(m)), v = ov(l, n.values.length), h = p == null ? void 0 : p[a.size], g = h ? nv(h, u, a.direction) : 0;
    return /* @__PURE__ */ c(
      "span",
      {
        style: {
          transform: "var(--radix-slider-thumb-transform)",
          position: "absolute",
          [a.startEdge]: `calc(${u}% + ${g}px)`
        },
        children: /* @__PURE__ */ c(Pr.ItemSlot, { scope: o, children: /* @__PURE__ */ c(
          M.span,
          {
            role: "slider",
            "aria-label": e["aria-label"] || v,
            "aria-valuemin": n.min,
            "aria-valuenow": i,
            "aria-valuemax": n.max,
            "aria-orientation": n.orientation,
            "data-orientation": n.orientation,
            "data-disabled": n.disabled ? "" : void 0,
            tabIndex: n.disabled ? void 0 : 0,
            ...r,
            ref: d,
            style: i === void 0 ? { display: "none" } : e.style,
            onFocus: N(e.onFocus, () => {
              n.valueIndexToChangeRef.current = l;
            })
          }
        ) })
      }
    );
  }
);
zs.displayName = io;
var Bs = s.forwardRef(
  (e, t) => {
    const { __scopeSlider: o, name: r, ...n } = e;
    return /* @__PURE__ */ c(
      $s,
      {
        __scopeSlider: o,
        name: r,
        internal_do_not_use_render: ({ index: a, isFormControl: l }) => /* @__PURE__ */ O(Ee, { children: [
          /* @__PURE__ */ c(
            zs,
            {
              ...n,
              ref: t,
              __scopeSlider: o
            }
          ),
          l ? /* @__PURE__ */ c(
            Ws,
            {
              __scopeSlider: o
            },
            a
          ) : null
        ] })
      }
    );
  }
);
Bs.displayName = Os;
var Hs = "SliderBubbleInput", Ws = s.forwardRef(
  ({ __scopeSlider: e, ...t }, o) => {
    const { value: r, name: n, form: a } = Fs(Hs, e), l = s.useRef(null), i = L(l, o), u = Ao(r);
    return s.useEffect(() => {
      const p = l.current;
      if (!p) return;
      const f = window.HTMLInputElement.prototype, v = Object.getOwnPropertyDescriptor(f, "value").set;
      if (u !== r && v) {
        const h = new Event("input", { bubbles: !0 });
        v.call(p, r), p.dispatchEvent(h);
      }
    }, [u, r]), /* @__PURE__ */ c(
      M.input,
      {
        style: { display: "none" },
        name: n,
        form: a,
        ...t,
        ref: i,
        defaultValue: r
      }
    );
  }
);
Ws.displayName = Hs;
function tv(e = [], t, o) {
  const r = [...e];
  return r[o] = t, r.sort((n, a) => n - a);
}
function Gs(e, t, o) {
  const a = 100 / (o - t) * (e - t);
  return Mt(a, [0, 100]);
}
function ov(e, t) {
  return t > 2 ? `Value ${e + 1} of ${t}` : t === 2 ? ["Minimum", "Maximum"][e] : void 0;
}
function rv(e, t) {
  if (e.length === 1) return 0;
  const o = e.map((n) => Math.abs(n - t)), r = Math.min(...o);
  return o.indexOf(r);
}
function nv(e, t, o) {
  const r = e / 2, a = on([0, 50], [0, r]);
  return (r - a(t) * o) * o;
}
function av(e) {
  return e.slice(0, -1).map((t, o) => e[o + 1] - t);
}
function sv(e, t) {
  if (t > 0) {
    const o = av(e);
    return Math.min(...o) >= t;
  }
  return !0;
}
function on(e, t) {
  return (o) => {
    if (e[0] === e[1] || t[0] === t[1]) return t[0];
    const r = (t[1] - t[0]) / (e[1] - e[0]);
    return t[0] + r * (o - e[0]);
  };
}
function lv(e) {
  if (!Number.isFinite(e)) return 0;
  const t = e.toString();
  if (t.includes("e")) {
    const [r, n] = t.split("e"), a = r.split(".")[1] || "", l = Number(n);
    return Math.max(0, a.length - l);
  }
  const o = t.split(".")[1];
  return o ? o.length : 0;
}
function iv(e, t) {
  const o = Math.pow(10, t);
  return Math.round(e * o) / o;
}
function cv(e) {
  return typeof e == "function";
}
const uv = s.forwardRef(
  ({ className: e, disabled: t, ...o }, r) => {
    const n = o.value ?? o.defaultValue ?? [0], a = Array.isArray(n) ? n.length : 1;
    return /* @__PURE__ */ O(
      tn,
      {
        ref: r,
        disabled: t,
        className: S(
          "relative flex w-full touch-none select-none items-center cursor-pointer",
          t && "opacity-50 pointer-events-none cursor-not-allowed",
          e
        ),
        ...o,
        children: [
          /* @__PURE__ */ c(Ds, { className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-[color:var(--ds-theme-border-subtle)]", children: /* @__PURE__ */ c(ks, { className: "absolute h-full bg-[color:var(--ds-theme-intent-primary-fill)]" }) }),
          Array.from({ length: a }).map((l, i) => /* @__PURE__ */ c(
            Bs,
            {
              className: S(
                "block h-5 w-5 rounded-full border-2 border-[color:var(--ds-theme-intent-primary-fill)] bg-[color:var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] transition-colors duration-150",
                "hover:bg-[color:var(--ds-theme-surface-subdued)]",
                "focus:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]"
              )
            },
            i
          ))
        ]
      }
    );
  }
);
uv.displayName = tn.displayName;
var Vs = "Toggle", rn = s.forwardRef((e, t) => {
  const { pressed: o, defaultPressed: r, onPressedChange: n, ...a } = e, [l, i] = oe({
    prop: o,
    onChange: n,
    defaultProp: r ?? !1,
    caller: Vs
  });
  return /* @__PURE__ */ c(
    M.button,
    {
      type: "button",
      "aria-pressed": l,
      "data-state": l ? "on" : "off",
      "data-disabled": e.disabled ? "" : void 0,
      ...a,
      ref: t,
      onClick: N(e.onClick, () => {
        e.disabled || i(!l);
      })
    }
  );
});
rn.displayName = Vs;
var Us = rn;
const Ks = Fe(
  [
    "inline-flex items-center justify-center rounded-[var(--ds-component-button-radius)] text-sm font-medium transition-colors select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]"
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-transparent text-[color:var(--ds-theme-content-default)]",
          "hover:bg-[color:var(--ds-theme-surface-subdued)]",
          "data-[state=on]:bg-[color:var(--ds-theme-border-subtle)] data-[state=on]:text-[color:var(--ds-theme-content-default)]"
        ],
        outline: [
          "border border-[color:var(--ds-theme-border-subtle)] bg-transparent text-[color:var(--ds-theme-content-default)]",
          "hover:bg-[color:var(--ds-theme-surface-subdued)]",
          "data-[state=on]:border-[color:var(--ds-theme-border-default)] data-[state=on]:bg-[color:var(--ds-theme-border-subtle)]"
        ]
      },
      size: {
        sm: "h-8 px-2 min-w-[32px]",
        md: "h-10 px-3 min-w-[40px]",
        lg: "h-12 px-4 min-w-[48px]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
), dv = s.forwardRef(
  ({ className: e, variant: t, size: o, ...r }, n) => /* @__PURE__ */ c(
    Us,
    {
      ref: n,
      className: S(Ks({ variant: t, size: o }), e),
      ...r
    }
  )
);
dv.displayName = Us.displayName;
var je = "ToggleGroup", [js] = J(je, [
  Ae
]), Ys = Ae(), ko = s.forwardRef((e, t) => {
  const { type: o, ...r } = e;
  if (o === "single")
    return /* @__PURE__ */ c(fv, { role: "radiogroup", ...r, ref: t });
  if (o === "multiple")
    return /* @__PURE__ */ c(pv, { role: "toolbar", ...r, ref: t });
  throw new Error(`Missing prop \`type\` expected on \`${je}\``);
});
ko.displayName = je;
var [Xs, qs] = js(je), fv = s.forwardRef((e, t) => {
  const {
    value: o,
    defaultValue: r,
    onValueChange: n = () => {
    },
    ...a
  } = e, [l, i] = oe({
    prop: o,
    defaultProp: r ?? "",
    onChange: n,
    caller: je
  });
  return /* @__PURE__ */ c(
    Xs,
    {
      scope: e.__scopeToggleGroup,
      type: "single",
      value: s.useMemo(() => l ? [l] : [], [l]),
      onItemActivate: i,
      onItemDeactivate: s.useCallback(() => i(""), [i]),
      children: /* @__PURE__ */ c(Zs, { ...a, ref: t })
    }
  );
}), pv = s.forwardRef((e, t) => {
  const {
    value: o,
    defaultValue: r,
    onValueChange: n = () => {
    },
    ...a
  } = e, [l, i] = oe({
    prop: o,
    defaultProp: r ?? [],
    onChange: n,
    caller: je
  }), u = s.useCallback(
    (f) => i((d = []) => [...d, f]),
    [i]
  ), p = s.useCallback(
    (f) => i((d = []) => d.filter((v) => v !== f)),
    [i]
  );
  return /* @__PURE__ */ c(
    Xs,
    {
      scope: e.__scopeToggleGroup,
      type: "multiple",
      value: l,
      onItemActivate: u,
      onItemDeactivate: p,
      children: /* @__PURE__ */ c(Zs, { ...a, ref: t })
    }
  );
});
ko.displayName = je;
var [vv, mv] = js(je), Zs = s.forwardRef(
  (e, t) => {
    const {
      __scopeToggleGroup: o,
      disabled: r = !1,
      rovingFocus: n = !0,
      orientation: a,
      dir: l,
      loop: i = !0,
      ...u
    } = e, p = Ys(o), f = Pe(l), d = { dir: f, ...u };
    return /* @__PURE__ */ c(vv, { scope: o, rovingFocus: n, disabled: r, children: n ? /* @__PURE__ */ c(
      $t,
      {
        asChild: !0,
        ...p,
        orientation: a,
        dir: f,
        loop: i,
        children: /* @__PURE__ */ c(M.div, { ...d, ref: t })
      }
    ) : /* @__PURE__ */ c(M.div, { ...d, ref: t }) });
  }
), po = "ToggleGroupItem", nn = s.forwardRef(
  (e, t) => {
    const o = qs(po, e.__scopeToggleGroup), r = mv(po, e.__scopeToggleGroup), n = Ys(e.__scopeToggleGroup), a = o.value.includes(e.value), l = r.disabled || e.disabled, i = { ...e, pressed: a, disabled: l }, u = s.useRef(null);
    return r.rovingFocus ? /* @__PURE__ */ c(
      zt,
      {
        asChild: !0,
        ...n,
        focusable: !l,
        active: a,
        ref: u,
        children: /* @__PURE__ */ c(pa, { ...i, ref: t })
      }
    ) : /* @__PURE__ */ c(pa, { ...i, ref: t });
  }
);
nn.displayName = po;
var pa = s.forwardRef(
  (e, t) => {
    const { __scopeToggleGroup: o, value: r, ...n } = e, a = qs(po, o), l = { role: "radio", "aria-checked": e.pressed, "aria-pressed": void 0 }, i = a.type === "single" ? l : void 0;
    return /* @__PURE__ */ c(
      rn,
      {
        ...i,
        ...n,
        ref: t,
        onPressedChange: (u) => {
          u ? a.onItemActivate(r) : a.onItemDeactivate(r);
        }
      }
    );
  }
);
const Qs = s.createContext({
  variant: "default",
  size: "md"
}), hv = s.forwardRef(({ className: e, variant: t, size: o, children: r, ...n }, a) => /* @__PURE__ */ c(
  ko,
  {
    ref: a,
    className: S("inline-flex items-center justify-center gap-1", e),
    ...n,
    children: /* @__PURE__ */ c(Qs.Provider, { value: { variant: t, size: o }, children: r })
  }
));
hv.displayName = ko.displayName;
const gv = s.forwardRef(({ className: e, children: t, variant: o, size: r, ...n }, a) => {
  const l = s.useContext(Qs);
  return /* @__PURE__ */ c(
    nn,
    {
      ref: a,
      className: S(
        Ks({
          variant: l.variant ?? o,
          size: l.size ?? r
        }),
        e
      ),
      ...n,
      children: t
    }
  );
});
gv.displayName = nn.displayName;
var bv = "Separator", va = "horizontal", yv = ["horizontal", "vertical"], Js = s.forwardRef((e, t) => {
  const { decorative: o, orientation: r = va, ...n } = e, a = wv(r) ? r : va, i = o ? { role: "none" } : { "aria-orientation": a === "vertical" ? a : void 0, role: "separator" };
  return /* @__PURE__ */ c(
    M.div,
    {
      "data-orientation": a,
      ...i,
      ...n,
      ref: t
    }
  );
});
Js.displayName = bv;
function wv(e) {
  return yv.includes(e);
}
var el = Js;
const xv = s.forwardRef(
  ({ className: e, orientation: t = "horizontal", decorative: o = !0, ...r }, n) => /* @__PURE__ */ c(
    el,
    {
      ref: n,
      decorative: o,
      orientation: t,
      className: S(
        "shrink-0 bg-[color:var(--ds-theme-border-subtle)]",
        t === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        e
      ),
      ...r
    }
  )
);
xv.displayName = el.displayName;
var Cv = "AspectRatio", tl = s.forwardRef(
  (e, t) => {
    const { ratio: o = 1 / 1, style: r, ...n } = e;
    return /* @__PURE__ */ c(
      "div",
      {
        style: {
          // ensures inner element is contained
          position: "relative",
          // ensures padding bottom trick maths works
          width: "100%",
          paddingBottom: `${100 / o}%`
        },
        "data-radix-aspect-ratio-wrapper": "",
        children: /* @__PURE__ */ c(
          M.div,
          {
            ...n,
            ref: t,
            style: {
              ...r,
              // ensures children expand in ratio
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          }
        )
      }
    );
  }
);
tl.displayName = Cv;
var Sv = tl;
const w0 = Sv;
var Oo = "Collapsible", [Rv, ol] = J(Oo), [Nv, an] = Rv(Oo), rl = s.forwardRef(
  (e, t) => {
    const {
      __scopeCollapsible: o,
      open: r,
      defaultOpen: n,
      disabled: a,
      onOpenChange: l,
      ...i
    } = e, [u, p] = oe({
      prop: r,
      defaultProp: n ?? !1,
      onChange: l,
      caller: Oo
    });
    return /* @__PURE__ */ c(
      Nv,
      {
        scope: o,
        disabled: a,
        contentId: ne(),
        open: u,
        onOpenToggle: s.useCallback(() => p((f) => !f), [p]),
        children: /* @__PURE__ */ c(
          M.div,
          {
            "data-state": un(u),
            "data-disabled": a ? "" : void 0,
            ...i,
            ref: t
          }
        )
      }
    );
  }
);
rl.displayName = Oo;
var nl = "CollapsibleTrigger", sn = s.forwardRef(
  (e, t) => {
    const { __scopeCollapsible: o, ...r } = e, n = an(nl, o);
    return /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        "aria-controls": n.open ? n.contentId : void 0,
        "aria-expanded": n.open || !1,
        "data-state": un(n.open),
        "data-disabled": n.disabled ? "" : void 0,
        disabled: n.disabled,
        ...r,
        ref: t,
        onClick: N(e.onClick, n.onOpenToggle)
      }
    );
  }
);
sn.displayName = nl;
var ln = "CollapsibleContent", cn = s.forwardRef(
  (e, t) => {
    const { forceMount: o, ...r } = e, n = an(ln, e.__scopeCollapsible);
    return /* @__PURE__ */ c(ee, { present: o || n.open, children: ({ present: a }) => /* @__PURE__ */ c(Ev, { ...r, ref: t, present: a }) });
  }
);
cn.displayName = ln;
var Ev = s.forwardRef((e, t) => {
  const { __scopeCollapsible: o, present: r, children: n, ...a } = e, l = an(ln, o), [i, u] = s.useState(r), p = s.useRef(null), f = L(t, p), d = s.useRef(0), v = d.current, h = s.useRef(0), g = h.current, m = l.open || i, b = s.useRef(m), w = s.useRef(void 0);
  return s.useEffect(() => {
    const y = requestAnimationFrame(() => b.current = !1);
    return () => cancelAnimationFrame(y);
  }, []), re(() => {
    const y = p.current;
    if (y) {
      w.current = w.current || {
        transitionDuration: y.style.transitionDuration,
        animationName: y.style.animationName
      }, y.style.transitionDuration = "0s", y.style.animationName = "none";
      const x = y.getBoundingClientRect();
      d.current = x.height, h.current = x.width, b.current || (y.style.transitionDuration = w.current.transitionDuration, y.style.animationName = w.current.animationName), u(r);
    }
  }, [l.open, r]), /* @__PURE__ */ c(
    M.div,
    {
      "data-state": un(l.open),
      "data-disabled": l.disabled ? "" : void 0,
      id: l.contentId,
      hidden: !m,
      ...a,
      ref: f,
      style: {
        "--radix-collapsible-content-height": v ? `${v}px` : void 0,
        "--radix-collapsible-content-width": g ? `${g}px` : void 0,
        ...e.style
      },
      children: m && n
    }
  );
});
function un(e) {
  return e ? "open" : "closed";
}
var al = rl, Pv = sn, Av = cn;
const x0 = al, C0 = sn, S0 = cn;
function _v(e, t) {
  return s.useReducer((o, r) => t[o][r] ?? o, e);
}
var dn = "ScrollArea", [sl] = J(dn), [Tv, me] = sl(dn), ll = s.forwardRef(
  (e, t) => {
    const {
      __scopeScrollArea: o,
      type: r = "hover",
      dir: n,
      scrollHideDelay: a = 600,
      ...l
    } = e, [i, u] = s.useState(null), [p, f] = s.useState(null), [d, v] = s.useState(null), [h, g] = s.useState(null), [m, b] = s.useState(null), [w, y] = s.useState(0), [x, C] = s.useState(0), [R, E] = s.useState(!1), [P, I] = s.useState(!1), _ = L(t, (F) => u(F)), D = Pe(n);
    return /* @__PURE__ */ c(
      Tv,
      {
        scope: o,
        type: r,
        dir: D,
        scrollHideDelay: a,
        scrollArea: i,
        viewport: p,
        onViewportChange: f,
        content: d,
        onContentChange: v,
        scrollbarX: h,
        onScrollbarXChange: g,
        scrollbarXEnabled: R,
        onScrollbarXEnabledChange: E,
        scrollbarY: m,
        onScrollbarYChange: b,
        scrollbarYEnabled: P,
        onScrollbarYEnabledChange: I,
        onCornerWidthChange: y,
        onCornerHeightChange: C,
        children: /* @__PURE__ */ c(
          M.div,
          {
            dir: D,
            ...l,
            ref: _,
            style: {
              position: "relative",
              // Pass corner sizes as CSS vars to reduce re-renders of context consumers
              "--radix-scroll-area-corner-width": w + "px",
              "--radix-scroll-area-corner-height": x + "px",
              ...e.style
            }
          }
        )
      }
    );
  }
);
ll.displayName = dn;
var il = "ScrollAreaViewport", cl = s.forwardRef(
  (e, t) => {
    const { __scopeScrollArea: o, children: r, nonce: n, ...a } = e, l = me(il, o), i = s.useRef(null), u = L(t, i, l.onViewportChange);
    return /* @__PURE__ */ O(Ee, { children: [
      /* @__PURE__ */ c(Mv, { nonce: n }),
      /* @__PURE__ */ c(
        M.div,
        {
          "data-radix-scroll-area-viewport": "",
          ...a,
          ref: u,
          style: {
            /**
             * We don't support `visible` because the intention is to have at least one scrollbar
             * if this component is used and `visible` will behave like `auto` in that case
             * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow#description
             *
             * We don't handle `auto` because the intention is for the native implementation
             * to be hidden if using this component. We just want to ensure the node is scrollable
             * so could have used either `scroll` or `auto` here. We picked `scroll` to prevent
             * the browser from having to work out whether to render native scrollbars or not,
             * we tell it to with the intention of hiding them in CSS.
             */
            overflowX: l.scrollbarXEnabled ? "scroll" : "hidden",
            overflowY: l.scrollbarYEnabled ? "scroll" : "hidden",
            ...e.style
          },
          children: /* @__PURE__ */ c("div", { ref: l.onContentChange, style: { minWidth: "100%", display: "table" }, children: r })
        }
      )
    ] });
  }
);
cl.displayName = il;
var Mv = s.memo(
  ({ nonce: e }) => /* @__PURE__ */ c(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: "[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"
      },
      nonce: e
    }
  ),
  (e, t) => e.nonce === t.nonce
), _e = "ScrollAreaScrollbar", fn = s.forwardRef(
  (e, t) => {
    const { forceMount: o, ...r } = e, n = me(_e, e.__scopeScrollArea), { onScrollbarXEnabledChange: a, onScrollbarYEnabledChange: l } = n, i = e.orientation === "horizontal";
    return s.useEffect(() => (i ? a(!0) : l(!0), () => {
      i ? a(!1) : l(!1);
    }), [i, a, l]), n.type === "hover" ? /* @__PURE__ */ c(Iv, { ...r, ref: t, forceMount: o }) : n.type === "scroll" ? /* @__PURE__ */ c(Dv, { ...r, ref: t, forceMount: o }) : n.type === "auto" ? /* @__PURE__ */ c(ul, { ...r, ref: t, forceMount: o }) : n.type === "always" ? /* @__PURE__ */ c(pn, { ...r, ref: t, "data-state": "visible" }) : null;
  }
);
fn.displayName = _e;
var Iv = s.forwardRef((e, t) => {
  const { forceMount: o, ...r } = e, n = me(_e, e.__scopeScrollArea), [a, l] = s.useState(!1);
  return s.useEffect(() => {
    const i = n.scrollArea;
    let u = 0;
    if (i) {
      const p = () => {
        window.clearTimeout(u), l(!0);
      }, f = () => {
        u = window.setTimeout(() => l(!1), n.scrollHideDelay);
      };
      return i.addEventListener("pointerenter", p), i.addEventListener("pointerleave", f), () => {
        window.clearTimeout(u), i.removeEventListener("pointerenter", p), i.removeEventListener("pointerleave", f);
      };
    }
  }, [n.scrollArea, n.scrollHideDelay]), /* @__PURE__ */ c(ee, { present: o || a, children: /* @__PURE__ */ c(
    ul,
    {
      "data-state": a ? "visible" : "hidden",
      ...r,
      ref: t
    }
  ) });
}), Dv = s.forwardRef((e, t) => {
  const { forceMount: o, ...r } = e, n = me(_e, e.__scopeScrollArea), a = e.orientation === "horizontal", l = Lo(() => u("SCROLL_END"), 100), [i, u] = _v("hidden", {
    hidden: {
      SCROLL: "scrolling"
    },
    scrolling: {
      SCROLL_END: "idle",
      POINTER_ENTER: "interacting"
    },
    interacting: {
      SCROLL: "interacting",
      POINTER_LEAVE: "idle"
    },
    idle: {
      HIDE: "hidden",
      SCROLL: "scrolling",
      POINTER_ENTER: "interacting"
    }
  });
  return s.useEffect(() => {
    if (i === "idle") {
      const p = window.setTimeout(() => u("HIDE"), n.scrollHideDelay);
      return () => window.clearTimeout(p);
    }
  }, [i, n.scrollHideDelay, u]), s.useEffect(() => {
    const p = n.viewport, f = a ? "scrollLeft" : "scrollTop";
    if (p) {
      let d = p[f];
      const v = () => {
        const h = p[f];
        d !== h && (u("SCROLL"), l()), d = h;
      };
      return p.addEventListener("scroll", v), () => p.removeEventListener("scroll", v);
    }
  }, [n.viewport, a, u, l]), /* @__PURE__ */ c(ee, { present: o || i !== "hidden", children: /* @__PURE__ */ c(
    pn,
    {
      "data-state": i === "hidden" ? "hidden" : "visible",
      ...r,
      ref: t,
      onPointerEnter: N(e.onPointerEnter, () => u("POINTER_ENTER")),
      onPointerLeave: N(e.onPointerLeave, () => u("POINTER_LEAVE"))
    }
  ) });
}), ul = s.forwardRef((e, t) => {
  const o = me(_e, e.__scopeScrollArea), { forceMount: r, ...n } = e, [a, l] = s.useState(!1), i = e.orientation === "horizontal", u = Lo(() => {
    if (o.viewport) {
      const p = o.viewport.offsetWidth < o.viewport.scrollWidth, f = o.viewport.offsetHeight < o.viewport.scrollHeight;
      l(i ? p : f);
    }
  }, 10);
  return pt(o.viewport, u), pt(o.content, u), /* @__PURE__ */ c(ee, { present: r || a, children: /* @__PURE__ */ c(
    pn,
    {
      "data-state": a ? "visible" : "hidden",
      ...n,
      ref: t
    }
  ) });
}), pn = s.forwardRef((e, t) => {
  const { orientation: o = "vertical", ...r } = e, n = me(_e, e.__scopeScrollArea), a = s.useRef(null), l = s.useRef(0), [i, u] = s.useState({
    content: 0,
    viewport: 0,
    scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 }
  }), p = ml(i.viewport, i.content), f = {
    ...r,
    sizes: i,
    onSizesChange: u,
    hasThumb: p > 0 && p < 1,
    onThumbChange: (v) => a.current = v,
    onThumbPointerUp: () => l.current = 0,
    onThumbPointerDown: (v) => l.current = v
  };
  function d(v, h) {
    return zv(v, l.current, i, h);
  }
  return o === "horizontal" ? /* @__PURE__ */ c(
    kv,
    {
      ...f,
      ref: t,
      onThumbPositionChange: () => {
        if (n.viewport && a.current) {
          const v = n.viewport.scrollLeft, h = ma(v, i, n.dir);
          a.current.style.transform = `translate3d(${h}px, 0, 0)`;
        }
      },
      onWheelScroll: (v) => {
        n.viewport && (n.viewport.scrollLeft = v);
      },
      onDragScroll: (v) => {
        n.viewport && (n.viewport.scrollLeft = d(v, n.dir));
      }
    }
  ) : o === "vertical" ? /* @__PURE__ */ c(
    Ov,
    {
      ...f,
      ref: t,
      onThumbPositionChange: () => {
        if (n.viewport && a.current) {
          const v = n.viewport.scrollTop, h = ma(v, i);
          a.current.style.transform = `translate3d(0, ${h}px, 0)`;
        }
      },
      onWheelScroll: (v) => {
        n.viewport && (n.viewport.scrollTop = v);
      },
      onDragScroll: (v) => {
        n.viewport && (n.viewport.scrollTop = d(v));
      }
    }
  ) : null;
}), kv = s.forwardRef((e, t) => {
  const { sizes: o, onSizesChange: r, ...n } = e, a = me(_e, e.__scopeScrollArea), [l, i] = s.useState(), u = s.useRef(null), p = L(t, u, a.onScrollbarXChange);
  return s.useEffect(() => {
    u.current && i(getComputedStyle(u.current));
  }, [u]), /* @__PURE__ */ c(
    fl,
    {
      "data-orientation": "horizontal",
      ...n,
      ref: p,
      sizes: o,
      style: {
        bottom: 0,
        left: a.dir === "rtl" ? "var(--radix-scroll-area-corner-width)" : 0,
        right: a.dir === "ltr" ? "var(--radix-scroll-area-corner-width)" : 0,
        "--radix-scroll-area-thumb-width": Fo(o) + "px",
        ...e.style
      },
      onThumbPointerDown: (f) => e.onThumbPointerDown(f.x),
      onDragScroll: (f) => e.onDragScroll(f.x),
      onWheelScroll: (f, d) => {
        if (a.viewport) {
          const v = a.viewport.scrollLeft + f.deltaX;
          e.onWheelScroll(v), gl(v, d) && f.preventDefault();
        }
      },
      onResize: () => {
        u.current && a.viewport && l && r({
          content: a.viewport.scrollWidth,
          viewport: a.viewport.offsetWidth,
          scrollbar: {
            size: u.current.clientWidth,
            paddingStart: mo(l.paddingLeft),
            paddingEnd: mo(l.paddingRight)
          }
        });
      }
    }
  );
}), Ov = s.forwardRef((e, t) => {
  const { sizes: o, onSizesChange: r, ...n } = e, a = me(_e, e.__scopeScrollArea), [l, i] = s.useState(), u = s.useRef(null), p = L(t, u, a.onScrollbarYChange);
  return s.useEffect(() => {
    u.current && i(getComputedStyle(u.current));
  }, [u]), /* @__PURE__ */ c(
    fl,
    {
      "data-orientation": "vertical",
      ...n,
      ref: p,
      sizes: o,
      style: {
        top: 0,
        right: a.dir === "ltr" ? 0 : void 0,
        left: a.dir === "rtl" ? 0 : void 0,
        bottom: "var(--radix-scroll-area-corner-height)",
        "--radix-scroll-area-thumb-height": Fo(o) + "px",
        ...e.style
      },
      onThumbPointerDown: (f) => e.onThumbPointerDown(f.y),
      onDragScroll: (f) => e.onDragScroll(f.y),
      onWheelScroll: (f, d) => {
        if (a.viewport) {
          const v = a.viewport.scrollTop + f.deltaY;
          e.onWheelScroll(v), gl(v, d) && f.preventDefault();
        }
      },
      onResize: () => {
        u.current && a.viewport && l && r({
          content: a.viewport.scrollHeight,
          viewport: a.viewport.offsetHeight,
          scrollbar: {
            size: u.current.clientHeight,
            paddingStart: mo(l.paddingTop),
            paddingEnd: mo(l.paddingBottom)
          }
        });
      }
    }
  );
}), [Fv, dl] = sl(_e), fl = s.forwardRef((e, t) => {
  const {
    __scopeScrollArea: o,
    sizes: r,
    hasThumb: n,
    onThumbChange: a,
    onThumbPointerUp: l,
    onThumbPointerDown: i,
    onThumbPositionChange: u,
    onDragScroll: p,
    onWheelScroll: f,
    onResize: d,
    ...v
  } = e, h = me(_e, o), [g, m] = s.useState(null), b = L(t, (_) => m(_)), w = s.useRef(null), y = s.useRef(""), x = h.viewport, C = r.content - r.viewport, R = ae(f), E = ae(u), P = Lo(d, 10);
  function I(_) {
    if (w.current) {
      const D = _.clientX - w.current.left, F = _.clientY - w.current.top;
      p({ x: D, y: F });
    }
  }
  return s.useEffect(() => {
    const _ = (D) => {
      const F = D.target;
      (g == null ? void 0 : g.contains(F)) && R(D, C);
    };
    return document.addEventListener("wheel", _, { passive: !1 }), () => document.removeEventListener("wheel", _, { passive: !1 });
  }, [x, g, C, R]), s.useEffect(E, [r, E]), pt(g, P), pt(h.content, P), /* @__PURE__ */ c(
    Fv,
    {
      scope: o,
      scrollbar: g,
      hasThumb: n,
      onThumbChange: ae(a),
      onThumbPointerUp: ae(l),
      onThumbPositionChange: E,
      onThumbPointerDown: ae(i),
      children: /* @__PURE__ */ c(
        M.div,
        {
          ...v,
          ref: b,
          style: { position: "absolute", ...v.style },
          onPointerDown: N(e.onPointerDown, (_) => {
            _.button === 0 && (_.target.setPointerCapture(_.pointerId), w.current = g.getBoundingClientRect(), y.current = document.body.style.webkitUserSelect, document.body.style.webkitUserSelect = "none", h.viewport && (h.viewport.style.scrollBehavior = "auto"), I(_));
          }),
          onPointerMove: N(e.onPointerMove, I),
          onPointerUp: N(e.onPointerUp, (_) => {
            const D = _.target;
            D.hasPointerCapture(_.pointerId) && D.releasePointerCapture(_.pointerId), document.body.style.webkitUserSelect = y.current, h.viewport && (h.viewport.style.scrollBehavior = ""), w.current = null;
          })
        }
      )
    }
  );
}), vo = "ScrollAreaThumb", pl = s.forwardRef(
  (e, t) => {
    const { forceMount: o, ...r } = e, n = dl(vo, e.__scopeScrollArea);
    return /* @__PURE__ */ c(ee, { present: o || n.hasThumb, children: /* @__PURE__ */ c(Lv, { ref: t, ...r }) });
  }
), Lv = s.forwardRef(
  (e, t) => {
    const { __scopeScrollArea: o, style: r, ...n } = e, a = me(vo, o), l = dl(vo, o), { onThumbPositionChange: i } = l, u = L(
      t,
      (d) => l.onThumbChange(d)
    ), p = s.useRef(void 0), f = Lo(() => {
      p.current && (p.current(), p.current = void 0);
    }, 100);
    return s.useEffect(() => {
      const d = a.viewport;
      if (d) {
        const v = () => {
          if (f(), !p.current) {
            const h = Bv(d, i);
            p.current = h, i();
          }
        };
        return i(), d.addEventListener("scroll", v), () => d.removeEventListener("scroll", v);
      }
    }, [a.viewport, f, i]), /* @__PURE__ */ c(
      M.div,
      {
        "data-state": l.hasThumb ? "visible" : "hidden",
        ...n,
        ref: u,
        style: {
          width: "var(--radix-scroll-area-thumb-width)",
          height: "var(--radix-scroll-area-thumb-height)",
          ...r
        },
        onPointerDownCapture: N(e.onPointerDownCapture, (d) => {
          const h = d.target.getBoundingClientRect(), g = d.clientX - h.left, m = d.clientY - h.top;
          l.onThumbPointerDown({ x: g, y: m });
        }),
        onPointerUp: N(e.onPointerUp, l.onThumbPointerUp)
      }
    );
  }
);
pl.displayName = vo;
var vn = "ScrollAreaCorner", vl = s.forwardRef(
  (e, t) => {
    const o = me(vn, e.__scopeScrollArea), r = !!(o.scrollbarX && o.scrollbarY);
    return o.type !== "scroll" && r ? /* @__PURE__ */ c($v, { ...e, ref: t }) : null;
  }
);
vl.displayName = vn;
var $v = s.forwardRef((e, t) => {
  const { __scopeScrollArea: o, ...r } = e, n = me(vn, o), [a, l] = s.useState(0), [i, u] = s.useState(0), p = !!(a && i);
  return pt(n.scrollbarX, () => {
    var d;
    const f = ((d = n.scrollbarX) == null ? void 0 : d.offsetHeight) || 0;
    n.onCornerHeightChange(f), u(f);
  }), pt(n.scrollbarY, () => {
    var d;
    const f = ((d = n.scrollbarY) == null ? void 0 : d.offsetWidth) || 0;
    n.onCornerWidthChange(f), l(f);
  }), p ? /* @__PURE__ */ c(
    M.div,
    {
      ...r,
      ref: t,
      style: {
        width: a,
        height: i,
        position: "absolute",
        right: n.dir === "ltr" ? 0 : void 0,
        left: n.dir === "rtl" ? 0 : void 0,
        bottom: 0,
        ...e.style
      }
    }
  ) : null;
});
function mo(e) {
  return e ? parseInt(e, 10) : 0;
}
function ml(e, t) {
  const o = e / t;
  return isNaN(o) ? 0 : o;
}
function Fo(e) {
  const t = ml(e.viewport, e.content), o = e.scrollbar.paddingStart + e.scrollbar.paddingEnd, r = (e.scrollbar.size - o) * t;
  return Math.max(r, 18);
}
function zv(e, t, o, r = "ltr") {
  const n = Fo(o), a = n / 2, l = t || a, i = n - l, u = o.scrollbar.paddingStart + l, p = o.scrollbar.size - o.scrollbar.paddingEnd - i, f = o.content - o.viewport, d = r === "ltr" ? [0, f] : [f * -1, 0];
  return hl([u, p], d)(e);
}
function ma(e, t, o = "ltr") {
  const r = Fo(t), n = t.scrollbar.paddingStart + t.scrollbar.paddingEnd, a = t.scrollbar.size - n, l = t.content - t.viewport, i = a - r, u = o === "ltr" ? [0, l] : [l * -1, 0], p = Mt(e, u);
  return hl([0, l], [0, i])(p);
}
function hl(e, t) {
  return (o) => {
    if (e[0] === e[1] || t[0] === t[1]) return t[0];
    const r = (t[1] - t[0]) / (e[1] - e[0]);
    return t[0] + r * (o - e[0]);
  };
}
function gl(e, t) {
  return e > 0 && e < t;
}
var Bv = (e, t = () => {
}) => {
  let o = { left: e.scrollLeft, top: e.scrollTop }, r = 0;
  return (function n() {
    const a = { left: e.scrollLeft, top: e.scrollTop }, l = o.left !== a.left, i = o.top !== a.top;
    (l || i) && t(), o = a, r = window.requestAnimationFrame(n);
  })(), () => window.cancelAnimationFrame(r);
};
function Lo(e, t) {
  const o = ae(e), r = s.useRef(0);
  return s.useEffect(() => () => window.clearTimeout(r.current), []), s.useCallback(() => {
    window.clearTimeout(r.current), r.current = window.setTimeout(o, t);
  }, [o, t]);
}
function pt(e, t) {
  const o = ae(t);
  re(() => {
    let r = 0;
    if (e) {
      const n = new ResizeObserver(() => {
        cancelAnimationFrame(r), r = window.requestAnimationFrame(o);
      });
      return n.observe(e), () => {
        window.cancelAnimationFrame(r), n.unobserve(e);
      };
    }
  }, [e, o]);
}
var bl = ll, Hv = cl, Wv = vl;
const Gv = s.forwardRef(
  ({ className: e, children: t, ...o }, r) => /* @__PURE__ */ O(
    bl,
    {
      ref: r,
      className: S("relative overflow-hidden", e),
      ...o,
      children: [
        /* @__PURE__ */ c(Hv, { className: "h-full w-full rounded-[inherit]", children: t }),
        /* @__PURE__ */ c(yl, {}),
        /* @__PURE__ */ c(Wv, {})
      ]
    }
  )
);
Gv.displayName = bl.displayName;
const yl = s.forwardRef(({ className: e, orientation: t = "vertical", ...o }, r) => /* @__PURE__ */ c(
  fn,
  {
    ref: r,
    orientation: t,
    className: S(
      "flex select-none touch-none transition-colors duration-200 ease-out",
      t === "vertical" && "h-full w-2 border-l border-l-transparent p-[1px]",
      t === "horizontal" && "h-2 flex-col border-t border-t-transparent p-[1px]",
      e
    ),
    ...o,
    children: /* @__PURE__ */ c(pl, { className: "relative flex-1 rounded-full bg-[color:var(--ds-theme-border-default)] opacity-40 hover:opacity-80 transition-opacity duration-150" })
  }
));
yl.displayName = fn.displayName;
function R0({ className: e, ...t }) {
  return /* @__PURE__ */ c(
    "div",
    {
      className: S(
        "animate-pulse rounded-md bg-[color:var(--ds-theme-surface-subdued)]",
        e
      ),
      ...t
    }
  );
}
function Vv(e, t = globalThis == null ? void 0 : globalThis.document) {
  const o = ae(e);
  s.useEffect(() => {
    const r = (n) => {
      n.key === "Escape" && o(n);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [o, t]);
}
var Uv = "DismissableLayer", _r = "dismissableLayer.update", Kv = "dismissableLayer.pointerDownOutside", jv = "dismissableLayer.focusOutside", ha, mn = s.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set(),
  // Outside elements that belong to a layer's own dismiss affordance (eg, a
  // dialog overlay). Pressing them should dismiss the layer regardless of
  // whether or not they stop propagation.
  //
  // See https://github.com/radix-ui/primitives/issues/3346
  dismissableSurfaces: /* @__PURE__ */ new Set()
}), tt = s.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: o = !1,
      deferPointerDownOutside: r = !1,
      onEscapeKeyDown: n,
      onPointerDownOutside: a,
      onFocusOutside: l,
      onInteractOutside: i,
      onDismiss: u,
      ...p
    } = e, f = s.useContext(mn), [d, v] = s.useState(null), h = (d == null ? void 0 : d.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, g] = s.useState({}), m = L(t, (_) => v(_)), b = Array.from(f.layers), [w] = [...f.layersWithOutsidePointerEventsDisabled].slice(-1), y = b.indexOf(w), x = d ? b.indexOf(d) : -1, C = f.layersWithOutsidePointerEventsDisabled.size > 0, R = x >= y, E = s.useRef(!1), P = Zv(
      (_) => {
        const D = _.target;
        if (!(D instanceof Node))
          return;
        const F = [...f.branches].some(
          (T) => T.contains(D)
        );
        !R || F || (a == null || a(_), i == null || i(_), _.defaultPrevented || u == null || u());
      },
      {
        ownerDocument: h,
        deferPointerDownOutside: r,
        isDeferredPointerDownOutsideRef: E,
        dismissableSurfaces: f.dismissableSurfaces
      }
    ), I = Qv((_) => {
      if (r && E.current)
        return;
      const D = _.target;
      [...f.branches].some((T) => T.contains(D)) || (l == null || l(_), i == null || i(_), _.defaultPrevented || u == null || u());
    }, h);
    return Vv((_) => {
      x === f.layers.size - 1 && (n == null || n(_), !_.defaultPrevented && u && (_.preventDefault(), u()));
    }, h), s.useEffect(() => {
      if (d)
        return o && (f.layersWithOutsidePointerEventsDisabled.size === 0 && (ha = h.body.style.pointerEvents, h.body.style.pointerEvents = "none"), f.layersWithOutsidePointerEventsDisabled.add(d)), f.layers.add(d), ga(), () => {
          o && (f.layersWithOutsidePointerEventsDisabled.delete(d), f.layersWithOutsidePointerEventsDisabled.size === 0 && (h.body.style.pointerEvents = ha));
        };
    }, [d, h, o, f]), s.useEffect(() => () => {
      d && (f.layers.delete(d), f.layersWithOutsidePointerEventsDisabled.delete(d), ga());
    }, [d, f]), s.useEffect(() => {
      const _ = () => g({});
      return document.addEventListener(_r, _), () => document.removeEventListener(_r, _);
    }, []), /* @__PURE__ */ c(
      M.div,
      {
        ...p,
        ref: m,
        style: {
          pointerEvents: C ? R ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: N(e.onFocusCapture, I.onFocusCapture),
        onBlurCapture: N(e.onBlurCapture, I.onBlurCapture),
        onPointerDownCapture: N(
          e.onPointerDownCapture,
          P.onPointerDownCapture
        )
      }
    );
  }
);
tt.displayName = Uv;
var Yv = "DismissableLayerBranch", Xv = s.forwardRef((e, t) => {
  const o = s.useContext(mn), r = s.useRef(null), n = L(t, r);
  return s.useEffect(() => {
    const a = r.current;
    if (a)
      return o.branches.add(a), () => {
        o.branches.delete(a);
      };
  }, [o.branches]), /* @__PURE__ */ c(M.div, { ...e, ref: n });
});
Xv.displayName = Yv;
function qv() {
  const e = s.useContext(mn), [t, o] = s.useState(null);
  return s.useEffect(() => {
    if (t)
      return e.dismissableSurfaces.add(t), () => {
        e.dismissableSurfaces.delete(t);
      };
  }, [t, e.dismissableSurfaces]), o;
}
function Zv(e, t) {
  const {
    ownerDocument: o = globalThis == null ? void 0 : globalThis.document,
    deferPointerDownOutside: r = !1,
    isDeferredPointerDownOutsideRef: n,
    dismissableSurfaces: a
  } = t, l = ae(e), i = s.useRef(!1), u = s.useRef(!1), p = s.useRef(/* @__PURE__ */ new Map()), f = s.useRef(() => {
  });
  return s.useEffect(() => {
    function d() {
      u.current = !1, n.current = !1, p.current.clear();
    }
    function v() {
      return Array.from(p.current.values()).some(Boolean);
    }
    function h(y) {
      if (!u.current)
        return;
      const x = y.target;
      x instanceof Node && [...a].some((R) => R.contains(x)) || p.current.set(y.type, !0), y.type === "click" && window.setTimeout(() => {
        u.current && f.current();
      }, 0);
    }
    function g(y) {
      u.current && p.current.set(y.type, !1);
    }
    const m = (y) => {
      if (y.target && !i.current) {
        let x = function() {
          o.removeEventListener("click", f.current);
          const R = v();
          d(), R || wl(
            Kv,
            l,
            C,
            { discrete: !0 }
          );
        };
        const C = { originalEvent: y };
        u.current = !0, n.current = r && y.button === 0, p.current.clear(), !r || y.button !== 0 ? x() : (o.removeEventListener("click", f.current), f.current = x, o.addEventListener("click", f.current, { once: !0 }));
      } else
        o.removeEventListener("click", f.current), d();
      i.current = !1;
    }, b = [
      "pointerup",
      "mousedown",
      "mouseup",
      "touchstart",
      "touchend",
      "click"
    ];
    for (const y of b)
      o.addEventListener(y, h, !0), o.addEventListener(y, g);
    const w = window.setTimeout(() => {
      o.addEventListener("pointerdown", m);
    }, 0);
    return () => {
      window.clearTimeout(w), o.removeEventListener("pointerdown", m), o.removeEventListener("click", f.current);
      for (const y of b)
        o.removeEventListener(y, h, !0), o.removeEventListener(y, g);
    };
  }, [
    o,
    l,
    r,
    n,
    a
  ]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => i.current = !0
  };
}
function Qv(e, t = globalThis == null ? void 0 : globalThis.document) {
  const o = ae(e), r = s.useRef(!1);
  return s.useEffect(() => {
    const n = (a) => {
      a.target && !r.current && wl(jv, o, { originalEvent: a }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", n), () => t.removeEventListener("focusin", n);
  }, [t, o]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function ga() {
  const e = new CustomEvent(_r);
  document.dispatchEvent(e);
}
function wl(e, t, o, { discrete: r }) {
  const n = o.originalEvent.target, a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: o });
  t && n.addEventListener(e, t, { once: !0 }), r ? ts(n, a) : n.dispatchEvent(a);
}
var oo = 0, Ce = null;
function $o() {
  s.useEffect(() => {
    Ce || (Ce = { start: ba(), end: ba() });
    const { start: e, end: t } = Ce;
    return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), oo++, () => {
      oo === 1 && (Ce == null || Ce.start.remove(), Ce == null || Ce.end.remove(), Ce = null), oo = Math.max(0, oo - 1);
    };
  }, []);
}
function ba() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var mr = "focusScope.autoFocusOnMount", hr = "focusScope.autoFocusOnUnmount", ya = { bubbles: !1, cancelable: !0 }, Jv = "FocusScope", Ht = s.forwardRef((e, t) => {
  const {
    loop: o = !1,
    trapped: r = !1,
    onMountAutoFocus: n,
    onUnmountAutoFocus: a,
    ...l
  } = e, [i, u] = s.useState(null), p = ae(n), f = ae(a), d = s.useRef(null), v = L(t, (m) => u(m)), h = s.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  s.useEffect(() => {
    if (r) {
      let m = function(x) {
        if (h.paused || !i) return;
        const C = x.target;
        i.contains(C) ? d.current = C : He(d.current, { select: !0 });
      }, b = function(x) {
        if (h.paused || !i) return;
        const C = x.relatedTarget;
        C !== null && (i.contains(C) || He(d.current, { select: !0 }));
      }, w = function(x) {
        if (document.activeElement === document.body)
          for (const R of x)
            R.removedNodes.length > 0 && He(i);
      };
      document.addEventListener("focusin", m), document.addEventListener("focusout", b);
      const y = new MutationObserver(w);
      return i && y.observe(i, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", m), document.removeEventListener("focusout", b), y.disconnect();
      };
    }
  }, [r, i, h.paused]), s.useEffect(() => {
    if (i) {
      xa.add(h);
      const m = document.activeElement;
      if (!i.contains(m)) {
        const w = new CustomEvent(mr, ya);
        i.addEventListener(mr, p), i.dispatchEvent(w), w.defaultPrevented || (em(am(xl(i)), { select: !0 }), document.activeElement === m && He(i));
      }
      return () => {
        i.removeEventListener(mr, p), setTimeout(() => {
          const w = new CustomEvent(hr, ya);
          i.addEventListener(hr, f), i.dispatchEvent(w), w.defaultPrevented || He(m ?? document.body, { select: !0 }), i.removeEventListener(hr, f), xa.remove(h);
        }, 0);
      };
    }
  }, [i, p, f, h]);
  const g = s.useCallback(
    (m) => {
      if (!o && !r || h.paused) return;
      const b = m.key === "Tab" && !m.altKey && !m.ctrlKey && !m.metaKey, w = document.activeElement;
      if (b && w) {
        const y = m.currentTarget, [x, C] = tm(y);
        x && C ? !m.shiftKey && w === C ? (m.preventDefault(), o && He(x, { select: !0 })) : m.shiftKey && w === x && (m.preventDefault(), o && He(C, { select: !0 })) : w === y && m.preventDefault();
      }
    },
    [o, r, h.paused]
  );
  return /* @__PURE__ */ c(M.div, { tabIndex: -1, ...l, ref: v, onKeyDown: g });
});
Ht.displayName = Jv;
function em(e, { select: t = !1 } = {}) {
  const o = document.activeElement;
  for (const r of e)
    if (He(r, { select: t }), document.activeElement !== o) return;
}
function tm(e) {
  const t = xl(e), o = wa(t, e), r = wa(t.reverse(), e);
  return [o, r];
}
function xl(e) {
  const t = [], o = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const n = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || n ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; o.nextNode(); ) t.push(o.currentNode);
  return t;
}
function wa(e, t) {
  for (const o of e)
    if (!om(o, { upTo: t })) return o;
}
function om(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function rm(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function He(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const o = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== o && rm(e) && t && e.select();
  }
}
var xa = nm();
function nm() {
  let e = [];
  return {
    add(t) {
      const o = e[0];
      t !== o && (o == null || o.pause()), e = Ca(e, t), e.unshift(t);
    },
    remove(t) {
      var o;
      e = Ca(e, t), (o = e[0]) == null || o.resume();
    }
  };
}
function Ca(e, t) {
  const o = [...e], r = o.indexOf(t);
  return r !== -1 && o.splice(r, 1), o;
}
function am(e) {
  return e.filter((t) => t.tagName !== "A");
}
const sm = ["top", "right", "bottom", "left"], Ve = Math.min, ue = Math.max, ho = Math.round, ro = Math.floor, Ne = (e) => ({
  x: e,
  y: e
}), lm = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function Tr(e, t, o) {
  return ue(e, Ve(t, o));
}
function ke(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Oe(e) {
  return e.split("-")[0];
}
function xt(e) {
  return e.split("-")[1];
}
function hn(e) {
  return e === "x" ? "y" : "x";
}
function gn(e) {
  return e === "y" ? "height" : "width";
}
function Re(e) {
  const t = e[0];
  return t === "t" || t === "b" ? "y" : "x";
}
function bn(e) {
  return hn(Re(e));
}
function im(e, t, o) {
  o === void 0 && (o = !1);
  const r = xt(e), n = bn(e), a = gn(n);
  let l = n === "x" ? r === (o ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[a] > t.floating[a] && (l = go(l)), [l, go(l)];
}
function cm(e) {
  const t = go(e);
  return [Mr(e), t, Mr(t)];
}
function Mr(e) {
  return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
const Sa = ["left", "right"], Ra = ["right", "left"], um = ["top", "bottom"], dm = ["bottom", "top"];
function fm(e, t, o) {
  switch (e) {
    case "top":
    case "bottom":
      return o ? t ? Ra : Sa : t ? Sa : Ra;
    case "left":
    case "right":
      return t ? um : dm;
    default:
      return [];
  }
}
function pm(e, t, o, r) {
  const n = xt(e);
  let a = fm(Oe(e), o === "start", r);
  return n && (a = a.map((l) => l + "-" + n), t && (a = a.concat(a.map(Mr)))), a;
}
function go(e) {
  const t = Oe(e);
  return lm[t] + e.slice(t.length);
}
function vm(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Cl(e) {
  return typeof e != "number" ? vm(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function bo(e) {
  const {
    x: t,
    y: o,
    width: r,
    height: n
  } = e;
  return {
    width: r,
    height: n,
    top: o,
    left: t,
    right: t + r,
    bottom: o + n,
    x: t,
    y: o
  };
}
function Na(e, t, o) {
  let {
    reference: r,
    floating: n
  } = e;
  const a = Re(t), l = bn(t), i = gn(l), u = Oe(t), p = a === "y", f = r.x + r.width / 2 - n.width / 2, d = r.y + r.height / 2 - n.height / 2, v = r[i] / 2 - n[i] / 2;
  let h;
  switch (u) {
    case "top":
      h = {
        x: f,
        y: r.y - n.height
      };
      break;
    case "bottom":
      h = {
        x: f,
        y: r.y + r.height
      };
      break;
    case "right":
      h = {
        x: r.x + r.width,
        y: d
      };
      break;
    case "left":
      h = {
        x: r.x - n.width,
        y: d
      };
      break;
    default:
      h = {
        x: r.x,
        y: r.y
      };
  }
  switch (xt(t)) {
    case "start":
      h[l] -= v * (o && p ? -1 : 1);
      break;
    case "end":
      h[l] += v * (o && p ? -1 : 1);
      break;
  }
  return h;
}
async function mm(e, t) {
  var o;
  t === void 0 && (t = {});
  const {
    x: r,
    y: n,
    platform: a,
    rects: l,
    elements: i,
    strategy: u
  } = e, {
    boundary: p = "clippingAncestors",
    rootBoundary: f = "viewport",
    elementContext: d = "floating",
    altBoundary: v = !1,
    padding: h = 0
  } = ke(t, e), g = Cl(h), b = i[v ? d === "floating" ? "reference" : "floating" : d], w = bo(await a.getClippingRect({
    element: (o = await (a.isElement == null ? void 0 : a.isElement(b))) == null || o ? b : b.contextElement || await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(i.floating)),
    boundary: p,
    rootBoundary: f,
    strategy: u
  })), y = d === "floating" ? {
    x: r,
    y: n,
    width: l.floating.width,
    height: l.floating.height
  } : l.reference, x = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(i.floating)), C = await (a.isElement == null ? void 0 : a.isElement(x)) ? await (a.getScale == null ? void 0 : a.getScale(x)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, R = bo(a.convertOffsetParentRelativeRectToViewportRelativeRect ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: i,
    rect: y,
    offsetParent: x,
    strategy: u
  }) : y);
  return {
    top: (w.top - R.top + g.top) / C.y,
    bottom: (R.bottom - w.bottom + g.bottom) / C.y,
    left: (w.left - R.left + g.left) / C.x,
    right: (R.right - w.right + g.right) / C.x
  };
}
const hm = 50, gm = async (e, t, o) => {
  const {
    placement: r = "bottom",
    strategy: n = "absolute",
    middleware: a = [],
    platform: l
  } = o, i = l.detectOverflow ? l : {
    ...l,
    detectOverflow: mm
  }, u = await (l.isRTL == null ? void 0 : l.isRTL(t));
  let p = await l.getElementRects({
    reference: e,
    floating: t,
    strategy: n
  }), {
    x: f,
    y: d
  } = Na(p, r, u), v = r, h = 0;
  const g = {};
  for (let m = 0; m < a.length; m++) {
    const b = a[m];
    if (!b)
      continue;
    const {
      name: w,
      fn: y
    } = b, {
      x,
      y: C,
      data: R,
      reset: E
    } = await y({
      x: f,
      y: d,
      initialPlacement: r,
      placement: v,
      strategy: n,
      middlewareData: g,
      rects: p,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    f = x ?? f, d = C ?? d, g[w] = {
      ...g[w],
      ...R
    }, E && h < hm && (h++, typeof E == "object" && (E.placement && (v = E.placement), E.rects && (p = E.rects === !0 ? await l.getElementRects({
      reference: e,
      floating: t,
      strategy: n
    }) : E.rects), {
      x: f,
      y: d
    } = Na(p, v, u)), m = -1);
  }
  return {
    x: f,
    y: d,
    placement: v,
    strategy: n,
    middlewareData: g
  };
}, bm = (e) => ({
  name: "arrow",
  options: e,
  async fn(t) {
    const {
      x: o,
      y: r,
      placement: n,
      rects: a,
      platform: l,
      elements: i,
      middlewareData: u
    } = t, {
      element: p,
      padding: f = 0
    } = ke(e, t) || {};
    if (p == null)
      return {};
    const d = Cl(f), v = {
      x: o,
      y: r
    }, h = bn(n), g = gn(h), m = await l.getDimensions(p), b = h === "y", w = b ? "top" : "left", y = b ? "bottom" : "right", x = b ? "clientHeight" : "clientWidth", C = a.reference[g] + a.reference[h] - v[h] - a.floating[g], R = v[h] - a.reference[h], E = await (l.getOffsetParent == null ? void 0 : l.getOffsetParent(p));
    let P = E ? E[x] : 0;
    (!P || !await (l.isElement == null ? void 0 : l.isElement(E))) && (P = i.floating[x] || a.floating[g]);
    const I = C / 2 - R / 2, _ = P / 2 - m[g] / 2 - 1, D = Ve(d[w], _), F = Ve(d[y], _), T = D, H = P - m[g] - F, B = P / 2 - m[g] / 2 + I, U = Tr(T, B, H), z = !u.arrow && xt(n) != null && B !== U && a.reference[g] / 2 - (B < T ? D : F) - m[g] / 2 < 0, G = z ? B < T ? B - T : B - H : 0;
    return {
      [h]: v[h] + G,
      data: {
        [h]: U,
        centerOffset: B - U - G,
        ...z && {
          alignmentOffset: G
        }
      },
      reset: z
    };
  }
}), ym = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var o, r;
      const {
        placement: n,
        middlewareData: a,
        rects: l,
        initialPlacement: i,
        platform: u,
        elements: p
      } = t, {
        mainAxis: f = !0,
        crossAxis: d = !0,
        fallbackPlacements: v,
        fallbackStrategy: h = "bestFit",
        fallbackAxisSideDirection: g = "none",
        flipAlignment: m = !0,
        ...b
      } = ke(e, t);
      if ((o = a.arrow) != null && o.alignmentOffset)
        return {};
      const w = Oe(n), y = Re(i), x = Oe(i) === i, C = await (u.isRTL == null ? void 0 : u.isRTL(p.floating)), R = v || (x || !m ? [go(i)] : cm(i)), E = g !== "none";
      !v && E && R.push(...pm(i, m, g, C));
      const P = [i, ...R], I = await u.detectOverflow(t, b), _ = [];
      let D = ((r = a.flip) == null ? void 0 : r.overflows) || [];
      if (f && _.push(I[w]), d) {
        const B = im(n, l, C);
        _.push(I[B[0]], I[B[1]]);
      }
      if (D = [...D, {
        placement: n,
        overflows: _
      }], !_.every((B) => B <= 0)) {
        var F, T;
        const B = (((F = a.flip) == null ? void 0 : F.index) || 0) + 1, U = P[B];
        if (U && (!(d === "alignment" ? y !== Re(U) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        D.every((k) => Re(k.placement) === y ? k.overflows[0] > 0 : !0)))
          return {
            data: {
              index: B,
              overflows: D
            },
            reset: {
              placement: U
            }
          };
        let z = (T = D.filter((G) => G.overflows[0] <= 0).sort((G, k) => G.overflows[1] - k.overflows[1])[0]) == null ? void 0 : T.placement;
        if (!z)
          switch (h) {
            case "bestFit": {
              var H;
              const G = (H = D.filter((k) => {
                if (E) {
                  const A = Re(k.placement);
                  return A === y || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  A === "y";
                }
                return !0;
              }).map((k) => [k.placement, k.overflows.filter((A) => A > 0).reduce((A, V) => A + V, 0)]).sort((k, A) => k[1] - A[1])[0]) == null ? void 0 : H[0];
              G && (z = G);
              break;
            }
            case "initialPlacement":
              z = i;
              break;
          }
        if (n !== z)
          return {
            reset: {
              placement: z
            }
          };
      }
      return {};
    }
  };
};
function Ea(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width
  };
}
function Pa(e) {
  return sm.some((t) => e[t] >= 0);
}
const wm = function(e) {
  return e === void 0 && (e = {}), {
    name: "hide",
    options: e,
    async fn(t) {
      const {
        rects: o,
        platform: r
      } = t, {
        strategy: n = "referenceHidden",
        ...a
      } = ke(e, t);
      switch (n) {
        case "referenceHidden": {
          const l = await r.detectOverflow(t, {
            ...a,
            elementContext: "reference"
          }), i = Ea(l, o.reference);
          return {
            data: {
              referenceHiddenOffsets: i,
              referenceHidden: Pa(i)
            }
          };
        }
        case "escaped": {
          const l = await r.detectOverflow(t, {
            ...a,
            altBoundary: !0
          }), i = Ea(l, o.floating);
          return {
            data: {
              escapedOffsets: i,
              escaped: Pa(i)
            }
          };
        }
        default:
          return {};
      }
    }
  };
}, Sl = /* @__PURE__ */ new Set(["left", "top"]);
async function xm(e, t) {
  const {
    placement: o,
    platform: r,
    elements: n
  } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(n.floating)), l = Oe(o), i = xt(o), u = Re(o) === "y", p = Sl.has(l) ? -1 : 1, f = a && u ? -1 : 1, d = ke(t, e);
  let {
    mainAxis: v,
    crossAxis: h,
    alignmentAxis: g
  } = typeof d == "number" ? {
    mainAxis: d,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: d.mainAxis || 0,
    crossAxis: d.crossAxis || 0,
    alignmentAxis: d.alignmentAxis
  };
  return i && typeof g == "number" && (h = i === "end" ? g * -1 : g), u ? {
    x: h * f,
    y: v * p
  } : {
    x: v * p,
    y: h * f
  };
}
const Cm = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var o, r;
      const {
        x: n,
        y: a,
        placement: l,
        middlewareData: i
      } = t, u = await xm(t, e);
      return l === ((o = i.offset) == null ? void 0 : o.placement) && (r = i.arrow) != null && r.alignmentOffset ? {} : {
        x: n + u.x,
        y: a + u.y,
        data: {
          ...u,
          placement: l
        }
      };
    }
  };
}, Sm = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: o,
        y: r,
        placement: n,
        platform: a
      } = t, {
        mainAxis: l = !0,
        crossAxis: i = !1,
        limiter: u = {
          fn: (w) => {
            let {
              x: y,
              y: x
            } = w;
            return {
              x: y,
              y: x
            };
          }
        },
        ...p
      } = ke(e, t), f = {
        x: o,
        y: r
      }, d = await a.detectOverflow(t, p), v = Re(Oe(n)), h = hn(v);
      let g = f[h], m = f[v];
      if (l) {
        const w = h === "y" ? "top" : "left", y = h === "y" ? "bottom" : "right", x = g + d[w], C = g - d[y];
        g = Tr(x, g, C);
      }
      if (i) {
        const w = v === "y" ? "top" : "left", y = v === "y" ? "bottom" : "right", x = m + d[w], C = m - d[y];
        m = Tr(x, m, C);
      }
      const b = u.fn({
        ...t,
        [h]: g,
        [v]: m
      });
      return {
        ...b,
        data: {
          x: b.x - o,
          y: b.y - r,
          enabled: {
            [h]: l,
            [v]: i
          }
        }
      };
    }
  };
}, Rm = function(e) {
  return e === void 0 && (e = {}), {
    options: e,
    fn(t) {
      const {
        x: o,
        y: r,
        placement: n,
        rects: a,
        middlewareData: l
      } = t, {
        offset: i = 0,
        mainAxis: u = !0,
        crossAxis: p = !0
      } = ke(e, t), f = {
        x: o,
        y: r
      }, d = Re(n), v = hn(d);
      let h = f[v], g = f[d];
      const m = ke(i, t), b = typeof m == "number" ? {
        mainAxis: m,
        crossAxis: 0
      } : {
        mainAxis: 0,
        crossAxis: 0,
        ...m
      };
      if (u) {
        const x = v === "y" ? "height" : "width", C = a.reference[v] - a.floating[x] + b.mainAxis, R = a.reference[v] + a.reference[x] - b.mainAxis;
        h < C ? h = C : h > R && (h = R);
      }
      if (p) {
        var w, y;
        const x = v === "y" ? "width" : "height", C = Sl.has(Oe(n)), R = a.reference[d] - a.floating[x] + (C && ((w = l.offset) == null ? void 0 : w[d]) || 0) + (C ? 0 : b.crossAxis), E = a.reference[d] + a.reference[x] + (C ? 0 : ((y = l.offset) == null ? void 0 : y[d]) || 0) - (C ? b.crossAxis : 0);
        g < R ? g = R : g > E && (g = E);
      }
      return {
        [v]: h,
        [d]: g
      };
    }
  };
}, Nm = function(e) {
  return e === void 0 && (e = {}), {
    name: "size",
    options: e,
    async fn(t) {
      var o, r;
      const {
        placement: n,
        rects: a,
        platform: l,
        elements: i
      } = t, {
        apply: u = () => {
        },
        ...p
      } = ke(e, t), f = await l.detectOverflow(t, p), d = Oe(n), v = xt(n), h = Re(n) === "y", {
        width: g,
        height: m
      } = a.floating;
      let b, w;
      d === "top" || d === "bottom" ? (b = d, w = v === (await (l.isRTL == null ? void 0 : l.isRTL(i.floating)) ? "start" : "end") ? "left" : "right") : (w = d, b = v === "end" ? "top" : "bottom");
      const y = m - f.top - f.bottom, x = g - f.left - f.right, C = Ve(m - f[b], y), R = Ve(g - f[w], x), E = !t.middlewareData.shift;
      let P = C, I = R;
      if ((o = t.middlewareData.shift) != null && o.enabled.x && (I = x), (r = t.middlewareData.shift) != null && r.enabled.y && (P = y), E && !v) {
        const D = ue(f.left, 0), F = ue(f.right, 0), T = ue(f.top, 0), H = ue(f.bottom, 0);
        h ? I = g - 2 * (D !== 0 || F !== 0 ? D + F : ue(f.left, f.right)) : P = m - 2 * (T !== 0 || H !== 0 ? T + H : ue(f.top, f.bottom));
      }
      await u({
        ...t,
        availableWidth: I,
        availableHeight: P
      });
      const _ = await l.getDimensions(i.floating);
      return g !== _.width || m !== _.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function zo() {
  return typeof window < "u";
}
function Ct(e) {
  return Rl(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function de(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Te(e) {
  var t;
  return (t = (Rl(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Rl(e) {
  return zo() ? e instanceof Node || e instanceof de(e).Node : !1;
}
function ge(e) {
  return zo() ? e instanceof Element || e instanceof de(e).Element : !1;
}
function Le(e) {
  return zo() ? e instanceof HTMLElement || e instanceof de(e).HTMLElement : !1;
}
function Aa(e) {
  return !zo() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof de(e).ShadowRoot;
}
function Wt(e) {
  const {
    overflow: t,
    overflowX: o,
    overflowY: r,
    display: n
  } = be(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + o) && n !== "inline" && n !== "contents";
}
function Em(e) {
  return /^(table|td|th)$/.test(Ct(e));
}
function Bo(e) {
  try {
    if (e.matches(":popover-open"))
      return !0;
  } catch {
  }
  try {
    return e.matches(":modal");
  } catch {
    return !1;
  }
}
const Pm = /transform|translate|scale|rotate|perspective|filter/, Am = /paint|layout|strict|content/, Qe = (e) => !!e && e !== "none";
let gr;
function yn(e) {
  const t = ge(e) ? be(e) : e;
  return Qe(t.transform) || Qe(t.translate) || Qe(t.scale) || Qe(t.rotate) || Qe(t.perspective) || !wn() && (Qe(t.backdropFilter) || Qe(t.filter)) || Pm.test(t.willChange || "") || Am.test(t.contain || "");
}
function _m(e) {
  let t = Ue(e);
  for (; Le(t) && !vt(t); ) {
    if (yn(t))
      return t;
    if (Bo(t))
      return null;
    t = Ue(t);
  }
  return null;
}
function wn() {
  return gr == null && (gr = typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none")), gr;
}
function vt(e) {
  return /^(html|body|#document)$/.test(Ct(e));
}
function be(e) {
  return de(e).getComputedStyle(e);
}
function Ho(e) {
  return ge(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function Ue(e) {
  if (Ct(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Aa(e) && e.host || // Fallback.
    Te(e)
  );
  return Aa(t) ? t.host : t;
}
function Nl(e) {
  const t = Ue(e);
  return vt(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Le(t) && Wt(t) ? t : Nl(t);
}
function It(e, t, o) {
  var r;
  t === void 0 && (t = []), o === void 0 && (o = !0);
  const n = Nl(e), a = n === ((r = e.ownerDocument) == null ? void 0 : r.body), l = de(n);
  if (a) {
    const i = Ir(l);
    return t.concat(l, l.visualViewport || [], Wt(n) ? n : [], i && o ? It(i) : []);
  } else
    return t.concat(n, It(n, [], o));
}
function Ir(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function El(e) {
  const t = be(e);
  let o = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const n = Le(e), a = n ? e.offsetWidth : o, l = n ? e.offsetHeight : r, i = ho(o) !== a || ho(r) !== l;
  return i && (o = a, r = l), {
    width: o,
    height: r,
    $: i
  };
}
function xn(e) {
  return ge(e) ? e : e.contextElement;
}
function dt(e) {
  const t = xn(e);
  if (!Le(t))
    return Ne(1);
  const o = t.getBoundingClientRect(), {
    width: r,
    height: n,
    $: a
  } = El(t);
  let l = (a ? ho(o.width) : o.width) / r, i = (a ? ho(o.height) : o.height) / n;
  return (!l || !Number.isFinite(l)) && (l = 1), (!i || !Number.isFinite(i)) && (i = 1), {
    x: l,
    y: i
  };
}
const Tm = /* @__PURE__ */ Ne(0);
function Pl(e) {
  const t = de(e);
  return !wn() || !t.visualViewport ? Tm : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Mm(e, t, o) {
  return t === void 0 && (t = !1), !o || t && o !== de(e) ? !1 : t;
}
function Je(e, t, o, r) {
  t === void 0 && (t = !1), o === void 0 && (o = !1);
  const n = e.getBoundingClientRect(), a = xn(e);
  let l = Ne(1);
  t && (r ? ge(r) && (l = dt(r)) : l = dt(e));
  const i = Mm(a, o, r) ? Pl(a) : Ne(0);
  let u = (n.left + i.x) / l.x, p = (n.top + i.y) / l.y, f = n.width / l.x, d = n.height / l.y;
  if (a) {
    const v = de(a), h = r && ge(r) ? de(r) : r;
    let g = v, m = Ir(g);
    for (; m && r && h !== g; ) {
      const b = dt(m), w = m.getBoundingClientRect(), y = be(m), x = w.left + (m.clientLeft + parseFloat(y.paddingLeft)) * b.x, C = w.top + (m.clientTop + parseFloat(y.paddingTop)) * b.y;
      u *= b.x, p *= b.y, f *= b.x, d *= b.y, u += x, p += C, g = de(m), m = Ir(g);
    }
  }
  return bo({
    width: f,
    height: d,
    x: u,
    y: p
  });
}
function Wo(e, t) {
  const o = Ho(e).scrollLeft;
  return t ? t.left + o : Je(Te(e)).left + o;
}
function Al(e, t) {
  const o = e.getBoundingClientRect(), r = o.left + t.scrollLeft - Wo(e, o), n = o.top + t.scrollTop;
  return {
    x: r,
    y: n
  };
}
function Im(e) {
  let {
    elements: t,
    rect: o,
    offsetParent: r,
    strategy: n
  } = e;
  const a = n === "fixed", l = Te(r), i = t ? Bo(t.floating) : !1;
  if (r === l || i && a)
    return o;
  let u = {
    scrollLeft: 0,
    scrollTop: 0
  }, p = Ne(1);
  const f = Ne(0), d = Le(r);
  if ((d || !d && !a) && ((Ct(r) !== "body" || Wt(l)) && (u = Ho(r)), d)) {
    const h = Je(r);
    p = dt(r), f.x = h.x + r.clientLeft, f.y = h.y + r.clientTop;
  }
  const v = l && !d && !a ? Al(l, u) : Ne(0);
  return {
    width: o.width * p.x,
    height: o.height * p.y,
    x: o.x * p.x - u.scrollLeft * p.x + f.x + v.x,
    y: o.y * p.y - u.scrollTop * p.y + f.y + v.y
  };
}
function Dm(e) {
  return Array.from(e.getClientRects());
}
function km(e) {
  const t = Te(e), o = Ho(e), r = e.ownerDocument.body, n = ue(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), a = ue(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let l = -o.scrollLeft + Wo(e);
  const i = -o.scrollTop;
  return be(r).direction === "rtl" && (l += ue(t.clientWidth, r.clientWidth) - n), {
    width: n,
    height: a,
    x: l,
    y: i
  };
}
const _a = 25;
function Om(e, t) {
  const o = de(e), r = Te(e), n = o.visualViewport;
  let a = r.clientWidth, l = r.clientHeight, i = 0, u = 0;
  if (n) {
    a = n.width, l = n.height;
    const f = wn();
    (!f || f && t === "fixed") && (i = n.offsetLeft, u = n.offsetTop);
  }
  const p = Wo(r);
  if (p <= 0) {
    const f = r.ownerDocument, d = f.body, v = getComputedStyle(d), h = f.compatMode === "CSS1Compat" && parseFloat(v.marginLeft) + parseFloat(v.marginRight) || 0, g = Math.abs(r.clientWidth - d.clientWidth - h);
    g <= _a && (a -= g);
  } else p <= _a && (a += p);
  return {
    width: a,
    height: l,
    x: i,
    y: u
  };
}
function Fm(e, t) {
  const o = Je(e, !0, t === "fixed"), r = o.top + e.clientTop, n = o.left + e.clientLeft, a = Le(e) ? dt(e) : Ne(1), l = e.clientWidth * a.x, i = e.clientHeight * a.y, u = n * a.x, p = r * a.y;
  return {
    width: l,
    height: i,
    x: u,
    y: p
  };
}
function Ta(e, t, o) {
  let r;
  if (t === "viewport")
    r = Om(e, o);
  else if (t === "document")
    r = km(Te(e));
  else if (ge(t))
    r = Fm(t, o);
  else {
    const n = Pl(e);
    r = {
      x: t.x - n.x,
      y: t.y - n.y,
      width: t.width,
      height: t.height
    };
  }
  return bo(r);
}
function _l(e, t) {
  const o = Ue(e);
  return o === t || !ge(o) || vt(o) ? !1 : be(o).position === "fixed" || _l(o, t);
}
function Lm(e, t) {
  const o = t.get(e);
  if (o)
    return o;
  let r = It(e, [], !1).filter((i) => ge(i) && Ct(i) !== "body"), n = null;
  const a = be(e).position === "fixed";
  let l = a ? Ue(e) : e;
  for (; ge(l) && !vt(l); ) {
    const i = be(l), u = yn(l);
    !u && i.position === "fixed" && (n = null), (a ? !u && !n : !u && i.position === "static" && !!n && (n.position === "absolute" || n.position === "fixed") || Wt(l) && !u && _l(e, l)) ? r = r.filter((f) => f !== l) : n = i, l = Ue(l);
  }
  return t.set(e, r), r;
}
function $m(e) {
  let {
    element: t,
    boundary: o,
    rootBoundary: r,
    strategy: n
  } = e;
  const l = [...o === "clippingAncestors" ? Bo(t) ? [] : Lm(t, this._c) : [].concat(o), r], i = Ta(t, l[0], n);
  let u = i.top, p = i.right, f = i.bottom, d = i.left;
  for (let v = 1; v < l.length; v++) {
    const h = Ta(t, l[v], n);
    u = ue(h.top, u), p = Ve(h.right, p), f = Ve(h.bottom, f), d = ue(h.left, d);
  }
  return {
    width: p - d,
    height: f - u,
    x: d,
    y: u
  };
}
function zm(e) {
  const {
    width: t,
    height: o
  } = El(e);
  return {
    width: t,
    height: o
  };
}
function Bm(e, t, o) {
  const r = Le(t), n = Te(t), a = o === "fixed", l = Je(e, !0, a, t);
  let i = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const u = Ne(0);
  function p() {
    u.x = Wo(n);
  }
  if (r || !r && !a)
    if ((Ct(t) !== "body" || Wt(n)) && (i = Ho(t)), r) {
      const h = Je(t, !0, a, t);
      u.x = h.x + t.clientLeft, u.y = h.y + t.clientTop;
    } else n && p();
  a && !r && n && p();
  const f = n && !r && !a ? Al(n, i) : Ne(0), d = l.left + i.scrollLeft - u.x - f.x, v = l.top + i.scrollTop - u.y - f.y;
  return {
    x: d,
    y: v,
    width: l.width,
    height: l.height
  };
}
function br(e) {
  return be(e).position === "static";
}
function Ma(e, t) {
  if (!Le(e) || be(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let o = e.offsetParent;
  return Te(e) === o && (o = o.ownerDocument.body), o;
}
function Tl(e, t) {
  const o = de(e);
  if (Bo(e))
    return o;
  if (!Le(e)) {
    let n = Ue(e);
    for (; n && !vt(n); ) {
      if (ge(n) && !br(n))
        return n;
      n = Ue(n);
    }
    return o;
  }
  let r = Ma(e, t);
  for (; r && Em(r) && br(r); )
    r = Ma(r, t);
  return r && vt(r) && br(r) && !yn(r) ? o : r || _m(e) || o;
}
const Hm = async function(e) {
  const t = this.getOffsetParent || Tl, o = this.getDimensions, r = await o(e.floating);
  return {
    reference: Bm(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function Wm(e) {
  return be(e).direction === "rtl";
}
const Gm = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Im,
  getDocumentElement: Te,
  getClippingRect: $m,
  getOffsetParent: Tl,
  getElementRects: Hm,
  getClientRects: Dm,
  getDimensions: zm,
  getScale: dt,
  isElement: ge,
  isRTL: Wm
};
function Ml(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Vm(e, t) {
  let o = null, r;
  const n = Te(e);
  function a() {
    var i;
    clearTimeout(r), (i = o) == null || i.disconnect(), o = null;
  }
  function l(i, u) {
    i === void 0 && (i = !1), u === void 0 && (u = 1), a();
    const p = e.getBoundingClientRect(), {
      left: f,
      top: d,
      width: v,
      height: h
    } = p;
    if (i || t(), !v || !h)
      return;
    const g = ro(d), m = ro(n.clientWidth - (f + v)), b = ro(n.clientHeight - (d + h)), w = ro(f), x = {
      rootMargin: -g + "px " + -m + "px " + -b + "px " + -w + "px",
      threshold: ue(0, Ve(1, u)) || 1
    };
    let C = !0;
    function R(E) {
      const P = E[0].intersectionRatio;
      if (P !== u) {
        if (!C)
          return l();
        P ? l(!1, P) : r = setTimeout(() => {
          l(!1, 1e-7);
        }, 1e3);
      }
      P === 1 && !Ml(p, e.getBoundingClientRect()) && l(), C = !1;
    }
    try {
      o = new IntersectionObserver(R, {
        ...x,
        // Handle <iframe>s
        root: n.ownerDocument
      });
    } catch {
      o = new IntersectionObserver(R, x);
    }
    o.observe(e);
  }
  return l(!0), a;
}
function Um(e, t, o, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: n = !0,
    ancestorResize: a = !0,
    elementResize: l = typeof ResizeObserver == "function",
    layoutShift: i = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, p = xn(e), f = n || a ? [...p ? It(p) : [], ...t ? It(t) : []] : [];
  f.forEach((w) => {
    n && w.addEventListener("scroll", o, {
      passive: !0
    }), a && w.addEventListener("resize", o);
  });
  const d = p && i ? Vm(p, o) : null;
  let v = -1, h = null;
  l && (h = new ResizeObserver((w) => {
    let [y] = w;
    y && y.target === p && h && t && (h.unobserve(t), cancelAnimationFrame(v), v = requestAnimationFrame(() => {
      var x;
      (x = h) == null || x.observe(t);
    })), o();
  }), p && !u && h.observe(p), t && h.observe(t));
  let g, m = u ? Je(e) : null;
  u && b();
  function b() {
    const w = Je(e);
    m && !Ml(m, w) && o(), m = w, g = requestAnimationFrame(b);
  }
  return o(), () => {
    var w;
    f.forEach((y) => {
      n && y.removeEventListener("scroll", o), a && y.removeEventListener("resize", o);
    }), d == null || d(), (w = h) == null || w.disconnect(), h = null, u && cancelAnimationFrame(g);
  };
}
const Km = Cm, jm = Sm, Ym = ym, Xm = Nm, qm = wm, Ia = bm, Zm = Rm, Qm = (e, t, o) => {
  const r = /* @__PURE__ */ new Map(), n = {
    platform: Gm,
    ...o
  }, a = {
    ...n.platform,
    _c: r
  };
  return gm(e, t, {
    ...n,
    platform: a
  });
};
var Jm = typeof document < "u", eh = function() {
}, co = Jm ? Gd : eh;
function yo(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let o, r, n;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (o = e.length, o !== t.length) return !1;
      for (r = o; r-- !== 0; )
        if (!yo(e[r], t[r]))
          return !1;
      return !0;
    }
    if (n = Object.keys(e), o = n.length, o !== Object.keys(t).length)
      return !1;
    for (r = o; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, n[r]))
        return !1;
    for (r = o; r-- !== 0; ) {
      const a = n[r];
      if (!(a === "_owner" && e.$$typeof) && !yo(e[a], t[a]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Il(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Da(e, t) {
  const o = Il(e);
  return Math.round(t * o) / o;
}
function yr(e) {
  const t = s.useRef(e);
  return co(() => {
    t.current = e;
  }), t;
}
function th(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: o = "absolute",
    middleware: r = [],
    platform: n,
    elements: {
      reference: a,
      floating: l
    } = {},
    transform: i = !0,
    whileElementsMounted: u,
    open: p
  } = e, [f, d] = s.useState({
    x: 0,
    y: 0,
    strategy: o,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [v, h] = s.useState(r);
  yo(v, r) || h(r);
  const [g, m] = s.useState(null), [b, w] = s.useState(null), y = s.useCallback((k) => {
    k !== E.current && (E.current = k, m(k));
  }, []), x = s.useCallback((k) => {
    k !== P.current && (P.current = k, w(k));
  }, []), C = a || g, R = l || b, E = s.useRef(null), P = s.useRef(null), I = s.useRef(f), _ = u != null, D = yr(u), F = yr(n), T = yr(p), H = s.useCallback(() => {
    if (!E.current || !P.current)
      return;
    const k = {
      placement: t,
      strategy: o,
      middleware: v
    };
    F.current && (k.platform = F.current), Qm(E.current, P.current, k).then((A) => {
      const V = {
        ...A,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: T.current !== !1
      };
      B.current && !yo(I.current, V) && (I.current = V, Ft.flushSync(() => {
        d(V);
      }));
    });
  }, [v, t, o, F, T]);
  co(() => {
    p === !1 && I.current.isPositioned && (I.current.isPositioned = !1, d((k) => ({
      ...k,
      isPositioned: !1
    })));
  }, [p]);
  const B = s.useRef(!1);
  co(() => (B.current = !0, () => {
    B.current = !1;
  }), []), co(() => {
    if (C && (E.current = C), R && (P.current = R), C && R) {
      if (D.current)
        return D.current(C, R, H);
      H();
    }
  }, [C, R, H, D, _]);
  const U = s.useMemo(() => ({
    reference: E,
    floating: P,
    setReference: y,
    setFloating: x
  }), [y, x]), z = s.useMemo(() => ({
    reference: C,
    floating: R
  }), [C, R]), G = s.useMemo(() => {
    const k = {
      position: o,
      left: 0,
      top: 0
    };
    if (!z.floating)
      return k;
    const A = Da(z.floating, f.x), V = Da(z.floating, f.y);
    return i ? {
      ...k,
      transform: "translate(" + A + "px, " + V + "px)",
      ...Il(z.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: o,
      left: A,
      top: V
    };
  }, [o, i, z.floating, f.x, f.y]);
  return s.useMemo(() => ({
    ...f,
    update: H,
    refs: U,
    elements: z,
    floatingStyles: G
  }), [f, H, U, z, G]);
}
const oh = (e) => {
  function t(o) {
    return {}.hasOwnProperty.call(o, "current");
  }
  return {
    name: "arrow",
    options: e,
    fn(o) {
      const {
        element: r,
        padding: n
      } = typeof e == "function" ? e(o) : e;
      return r && t(r) ? r.current != null ? Ia({
        element: r.current,
        padding: n
      }).fn(o) : {} : r ? Ia({
        element: r,
        padding: n
      }).fn(o) : {};
    }
  };
}, rh = (e, t) => {
  const o = Km(e);
  return {
    name: o.name,
    fn: o.fn,
    options: [e, t]
  };
}, nh = (e, t) => {
  const o = jm(e);
  return {
    name: o.name,
    fn: o.fn,
    options: [e, t]
  };
}, ah = (e, t) => ({
  fn: Zm(e).fn,
  options: [e, t]
}), sh = (e, t) => {
  const o = Ym(e);
  return {
    name: o.name,
    fn: o.fn,
    options: [e, t]
  };
}, lh = (e, t) => {
  const o = Xm(e);
  return {
    name: o.name,
    fn: o.fn,
    options: [e, t]
  };
}, ih = (e, t) => {
  const o = qm(e);
  return {
    name: o.name,
    fn: o.fn,
    options: [e, t]
  };
}, ch = (e, t) => {
  const o = oh(e);
  return {
    name: o.name,
    fn: o.fn,
    options: [e, t]
  };
};
var uh = "Arrow", Dl = s.forwardRef((e, t) => {
  const { children: o, width: r = 10, height: n = 5, ...a } = e;
  return /* @__PURE__ */ c(
    M.svg,
    {
      ...a,
      ref: t,
      width: r,
      height: n,
      viewBox: "0 0 30 10",
      preserveAspectRatio: "none",
      children: e.asChild ? o : /* @__PURE__ */ c("polygon", { points: "0,0 30,0 15,10" })
    }
  );
});
Dl.displayName = uh;
var dh = Dl, Cn = "Popper", [kl, Me] = J(Cn), [fh, Ol] = kl(Cn), Fl = (e) => {
  const { __scopePopper: t, children: o } = e, [r, n] = s.useState(null), [a, l] = s.useState(void 0);
  return /* @__PURE__ */ c(
    fh,
    {
      scope: t,
      anchor: r,
      onAnchorChange: n,
      placementState: a,
      setPlacementState: l,
      children: o
    }
  );
};
Fl.displayName = Cn;
var Ll = "PopperAnchor", $l = s.forwardRef(
  (e, t) => {
    const { __scopePopper: o, virtualRef: r, ...n } = e, a = Ol(Ll, o), l = s.useRef(null), i = a.onAnchorChange, u = s.useCallback(
      (g) => {
        l.current = g, g && i(g);
      },
      [i]
    ), p = L(t, u), f = s.useRef(null);
    s.useEffect(() => {
      if (!r)
        return;
      const g = f.current;
      f.current = r.current, g !== f.current && i(f.current);
    });
    const d = a.placementState && Rn(a.placementState), v = d == null ? void 0 : d[0], h = d == null ? void 0 : d[1];
    return r ? null : /* @__PURE__ */ c(
      M.div,
      {
        "data-radix-popper-side": v,
        "data-radix-popper-align": h,
        ...n,
        ref: p
      }
    );
  }
);
$l.displayName = Ll;
var Sn = "PopperContent", [ph, vh] = kl(Sn), zl = s.forwardRef(
  (e, t) => {
    var X, Z, Y, j, q, xe;
    const {
      __scopePopper: o,
      side: r = "bottom",
      sideOffset: n = 0,
      align: a = "center",
      alignOffset: l = 0,
      arrowPadding: i = 0,
      avoidCollisions: u = !0,
      collisionBoundary: p = [],
      collisionPadding: f = 0,
      sticky: d = "partial",
      hideWhenDetached: v = !1,
      updatePositionStrategy: h = "optimized",
      onPlaced: g,
      ...m
    } = e, b = Ol(Sn, o), [w, y] = s.useState(null), x = L(t, (ce) => y(ce)), [C, R] = s.useState(null), E = _o(C), P = (E == null ? void 0 : E.width) ?? 0, I = (E == null ? void 0 : E.height) ?? 0, _ = r + (a !== "center" ? "-" + a : ""), D = typeof f == "number" ? f : { top: 0, right: 0, bottom: 0, left: 0, ...f }, F = Array.isArray(p) ? p : [p], T = F.length > 0, H = {
      padding: D,
      boundary: F.filter(hh),
      // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
      altBoundary: T
    }, { refs: B, floatingStyles: U, placement: z, isPositioned: G, middlewareData: k } = th({
      // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
      strategy: "fixed",
      placement: _,
      whileElementsMounted: (...ce) => Um(...ce, {
        animationFrame: h === "always"
      }),
      elements: {
        reference: b.anchor
      },
      middleware: [
        rh({ mainAxis: n + I, alignmentAxis: l }),
        u && nh({
          mainAxis: !0,
          crossAxis: !1,
          limiter: d === "partial" ? ah() : void 0,
          ...H
        }),
        u && sh({ ...H }),
        lh({
          ...H,
          apply: ({ elements: ce, rects: at, availableWidth: Nt, availableHeight: Et }) => {
            const { width: Hd, height: Wd } = at.reference, Jt = ce.floating.style;
            Jt.setProperty("--radix-popper-available-width", `${Nt}px`), Jt.setProperty("--radix-popper-available-height", `${Et}px`), Jt.setProperty("--radix-popper-anchor-width", `${Hd}px`), Jt.setProperty("--radix-popper-anchor-height", `${Wd}px`);
          }
        }),
        C && ch({ element: C, padding: i }),
        gh({ arrowWidth: P, arrowHeight: I }),
        v && ih({
          strategy: "referenceHidden",
          ...H,
          // `hide` detects whether the anchor (reference) is clipped, so when
          // no explicit `collisionBoundary` is set we fall back to Floating
          // UI's default clipping ancestors (e.g. a scrollable menu). This
          // lets an occluded submenu hide once its anchor scrolls out of view
          // (#3237). The collision/size middlewares deliberately keep the
          // viewport-based default to avoid clamping content rendered inside
          // transformed or overflow-clipping portal containers.
          boundary: T ? H.boundary : void 0
        })
      ]
    }), A = b.setPlacementState;
    re(() => (A(z), () => {
      A(void 0);
    }), [z, A]);
    const [V, K] = Rn(z), te = ae(g);
    re(() => {
      G && (te == null || te());
    }, [G, te]);
    const fe = (X = k.arrow) == null ? void 0 : X.x, pe = (Z = k.arrow) == null ? void 0 : Z.y, Ie = ((Y = k.arrow) == null ? void 0 : Y.centerOffset) !== 0, [ie, $] = s.useState();
    return re(() => {
      w && $(window.getComputedStyle(w).zIndex);
    }, [w]), /* @__PURE__ */ c(
      "div",
      {
        ref: B.setFloating,
        "data-radix-popper-content-wrapper": "",
        style: {
          ...U,
          transform: G ? U.transform : "translate(0, -200%)",
          // keep off the page when measuring
          minWidth: "max-content",
          zIndex: ie,
          "--radix-popper-transform-origin": [
            (j = k.transformOrigin) == null ? void 0 : j.x,
            (q = k.transformOrigin) == null ? void 0 : q.y
          ].join(" "),
          // hide the content if using the hide middleware and should be hidden
          // set visibility to hidden and disable pointer events so the UI behaves
          // as if the PopperContent isn't there at all
          ...((xe = k.hide) == null ? void 0 : xe.referenceHidden) && {
            visibility: "hidden",
            pointerEvents: "none"
          }
        },
        dir: e.dir,
        children: /* @__PURE__ */ c(
          ph,
          {
            scope: o,
            placedSide: V,
            placedAlign: K,
            onArrowChange: R,
            arrowX: fe,
            arrowY: pe,
            shouldHideArrow: Ie,
            children: /* @__PURE__ */ c(
              M.div,
              {
                "data-side": V,
                "data-align": K,
                ...m,
                ref: x,
                style: {
                  ...m.style,
                  // if the PopperContent hasn't been placed yet (not all measurements done)
                  // we prevent animations so that users's animation don't kick in too early referring wrong sides
                  animation: G ? void 0 : "none"
                }
              }
            )
          }
        )
      }
    );
  }
);
zl.displayName = Sn;
var Bl = "PopperArrow", mh = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
}, Hl = s.forwardRef(function(t, o) {
  const { __scopePopper: r, ...n } = t, a = vh(Bl, r), l = mh[a.placedSide];
  return (
    // we have to use an extra wrapper because `ResizeObserver` (used by `useSize`)
    // doesn't report size as we'd expect on SVG elements.
    // it reports their bounding box which is effectively the largest path inside the SVG.
    /* @__PURE__ */ c(
      "span",
      {
        ref: a.onArrowChange,
        style: {
          position: "absolute",
          left: a.arrowX,
          top: a.arrowY,
          [l]: 0,
          transformOrigin: {
            top: "",
            right: "0 0",
            bottom: "center 0",
            left: "100% 0"
          }[a.placedSide],
          transform: {
            top: "translateY(100%)",
            right: "translateY(50%) rotate(90deg) translateX(-50%)",
            bottom: "rotate(180deg)",
            left: "translateY(50%) rotate(-90deg) translateX(50%)"
          }[a.placedSide],
          visibility: a.shouldHideArrow ? "hidden" : void 0
        },
        children: /* @__PURE__ */ c(
          dh,
          {
            ...n,
            ref: o,
            style: {
              ...n.style,
              // ensures the element can be measured correctly (mostly for if SVG)
              display: "block"
            }
          }
        )
      }
    )
  );
});
Hl.displayName = Bl;
function hh(e) {
  return e !== null;
}
var gh = (e) => ({
  name: "transformOrigin",
  options: e,
  fn(t) {
    var b, w, y;
    const { placement: o, rects: r, middlewareData: n } = t, l = ((b = n.arrow) == null ? void 0 : b.centerOffset) !== 0, i = l ? 0 : e.arrowWidth, u = l ? 0 : e.arrowHeight, [p, f] = Rn(o), d = { start: "0%", center: "50%", end: "100%" }[f], v = (((w = n.arrow) == null ? void 0 : w.x) ?? 0) + i / 2, h = (((y = n.arrow) == null ? void 0 : y.y) ?? 0) + u / 2;
    let g = "", m = "";
    return p === "bottom" ? (g = l ? d : `${v}px`, m = `${-u}px`) : p === "top" ? (g = l ? d : `${v}px`, m = `${r.floating.height + u}px`) : p === "right" ? (g = `${-u}px`, m = l ? d : `${h}px`) : p === "left" && (g = `${r.floating.width + u}px`, m = l ? d : `${h}px`), { data: { x: g, y: m } };
  }
});
function Rn(e) {
  const [t, o = "center"] = e.split("-");
  return [t, o];
}
var St = Fl, Rt = $l, Gt = zl, Vt = Hl, bh = "Portal", ot = s.forwardRef((e, t) => {
  var i;
  const { container: o, ...r } = e, [n, a] = s.useState(!1);
  re(() => a(!0), []);
  const l = o || n && ((i = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : i.body);
  return l ? Ft.createPortal(/* @__PURE__ */ c(M.div, { ...r, ref: t }), l) : null;
});
ot.displayName = bh;
var yh = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, st = /* @__PURE__ */ new WeakMap(), no = /* @__PURE__ */ new WeakMap(), ao = {}, wr = 0, Wl = function(e) {
  return e && (e.host || Wl(e.parentNode));
}, wh = function(e, t) {
  return t.map(function(o) {
    if (e.contains(o))
      return o;
    var r = Wl(o);
    return r && e.contains(r) ? r : (console.error("aria-hidden", o, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(o) {
    return !!o;
  });
}, xh = function(e, t, o, r) {
  var n = wh(t, Array.isArray(e) ? e : [e]);
  ao[o] || (ao[o] = /* @__PURE__ */ new WeakMap());
  var a = ao[o], l = [], i = /* @__PURE__ */ new Set(), u = new Set(n), p = function(d) {
    !d || i.has(d) || (i.add(d), p(d.parentNode));
  };
  n.forEach(p);
  var f = function(d) {
    !d || u.has(d) || Array.prototype.forEach.call(d.children, function(v) {
      if (i.has(v))
        f(v);
      else
        try {
          var h = v.getAttribute(r), g = h !== null && h !== "false", m = (st.get(v) || 0) + 1, b = (a.get(v) || 0) + 1;
          st.set(v, m), a.set(v, b), l.push(v), m === 1 && g && no.set(v, !0), b === 1 && v.setAttribute(o, "true"), g || v.setAttribute(r, "true");
        } catch (w) {
          console.error("aria-hidden: cannot operate on ", v, w);
        }
    });
  };
  return f(t), i.clear(), wr++, function() {
    l.forEach(function(d) {
      var v = st.get(d) - 1, h = a.get(d) - 1;
      st.set(d, v), a.set(d, h), v || (no.has(d) || d.removeAttribute(r), no.delete(d)), h || d.removeAttribute(o);
    }), wr--, wr || (st = /* @__PURE__ */ new WeakMap(), st = /* @__PURE__ */ new WeakMap(), no = /* @__PURE__ */ new WeakMap(), ao = {});
  };
}, Go = function(e, t, o) {
  o === void 0 && (o = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), n = yh(e);
  return n ? (r.push.apply(r, Array.from(n.querySelectorAll("[aria-live], script"))), xh(r, n, o, "aria-hidden")) : function() {
    return null;
  };
}, Se = function() {
  return Se = Object.assign || function(t) {
    for (var o, r = 1, n = arguments.length; r < n; r++) {
      o = arguments[r];
      for (var a in o) Object.prototype.hasOwnProperty.call(o, a) && (t[a] = o[a]);
    }
    return t;
  }, Se.apply(this, arguments);
};
function Gl(e, t) {
  var o = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (o[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, r = Object.getOwnPropertySymbols(e); n < r.length; n++)
      t.indexOf(r[n]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[n]) && (o[r[n]] = e[r[n]]);
  return o;
}
function Ch(e, t, o) {
  if (o || arguments.length === 2) for (var r = 0, n = t.length, a; r < n; r++)
    (a || !(r in t)) && (a || (a = Array.prototype.slice.call(t, 0, r)), a[r] = t[r]);
  return e.concat(a || Array.prototype.slice.call(t));
}
var uo = "right-scroll-bar-position", fo = "width-before-scroll-bar", Sh = "with-scroll-bars-hidden", Rh = "--removed-body-scroll-bar-size";
function xr(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Nh(e, t) {
  var o = Vd(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return o.value;
        },
        set current(r) {
          var n = o.value;
          n !== r && (o.value = r, o.callback(r, n));
        }
      }
    };
  })[0];
  return o.callback = t, o.facade;
}
var Eh = typeof window < "u" ? s.useLayoutEffect : s.useEffect, ka = /* @__PURE__ */ new WeakMap();
function Ph(e, t) {
  var o = Nh(null, function(r) {
    return e.forEach(function(n) {
      return xr(n, r);
    });
  });
  return Eh(function() {
    var r = ka.get(o);
    if (r) {
      var n = new Set(r), a = new Set(e), l = o.current;
      n.forEach(function(i) {
        a.has(i) || xr(i, null);
      }), a.forEach(function(i) {
        n.has(i) || xr(i, l);
      });
    }
    ka.set(o, e);
  }, [e]), o;
}
function Ah(e) {
  return e;
}
function _h(e, t) {
  t === void 0 && (t = Ah);
  var o = [], r = !1, n = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return o.length ? o[o.length - 1] : e;
    },
    useMedium: function(a) {
      var l = t(a, r);
      return o.push(l), function() {
        o = o.filter(function(i) {
          return i !== l;
        });
      };
    },
    assignSyncMedium: function(a) {
      for (r = !0; o.length; ) {
        var l = o;
        o = [], l.forEach(a);
      }
      o = {
        push: function(i) {
          return a(i);
        },
        filter: function() {
          return o;
        }
      };
    },
    assignMedium: function(a) {
      r = !0;
      var l = [];
      if (o.length) {
        var i = o;
        o = [], i.forEach(a), l = o;
      }
      var u = function() {
        var f = l;
        l = [], f.forEach(a);
      }, p = function() {
        return Promise.resolve().then(u);
      };
      p(), o = {
        push: function(f) {
          l.push(f), p();
        },
        filter: function(f) {
          return l = l.filter(f), o;
        }
      };
    }
  };
  return n;
}
function Th(e) {
  e === void 0 && (e = {});
  var t = _h(null);
  return t.options = Se({ async: !0, ssr: !1 }, e), t;
}
var Vl = function(e) {
  var t = e.sideCar, o = Gl(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return s.createElement(r, Se({}, o));
};
Vl.isSideCarExport = !0;
function Mh(e, t) {
  return e.useMedium(t), Vl;
}
var Ul = Th(), Cr = function() {
}, Vo = s.forwardRef(function(e, t) {
  var o = s.useRef(null), r = s.useState({
    onScrollCapture: Cr,
    onWheelCapture: Cr,
    onTouchMoveCapture: Cr
  }), n = r[0], a = r[1], l = e.forwardProps, i = e.children, u = e.className, p = e.removeScrollBar, f = e.enabled, d = e.shards, v = e.sideCar, h = e.noRelative, g = e.noIsolation, m = e.inert, b = e.allowPinchZoom, w = e.as, y = w === void 0 ? "div" : w, x = e.gapMode, C = Gl(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), R = v, E = Ph([o, t]), P = Se(Se({}, C), n);
  return s.createElement(
    s.Fragment,
    null,
    f && s.createElement(R, { sideCar: Ul, removeScrollBar: p, shards: d, noRelative: h, noIsolation: g, inert: m, setCallbacks: a, allowPinchZoom: !!b, lockRef: o, gapMode: x }),
    l ? s.cloneElement(s.Children.only(i), Se(Se({}, P), { ref: E })) : s.createElement(y, Se({}, P, { className: u, ref: E }), i)
  );
});
Vo.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Vo.classNames = {
  fullWidth: fo,
  zeroRight: uo
};
var Ih = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function Dh() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = Ih();
  return t && e.setAttribute("nonce", t), e;
}
function kh(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function Oh(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Fh = function() {
  var e = 0, t = null;
  return {
    add: function(o) {
      e == 0 && (t = Dh()) && (kh(t, o), Oh(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, Lh = function() {
  var e = Fh();
  return function(t, o) {
    s.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && o]);
  };
}, Kl = function() {
  var e = Lh(), t = function(o) {
    var r = o.styles, n = o.dynamic;
    return e(r, n), null;
  };
  return t;
}, $h = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, Sr = function(e) {
  return parseInt(e || "", 10) || 0;
}, zh = function(e) {
  var t = window.getComputedStyle(document.body), o = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], n = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [Sr(o), Sr(r), Sr(n)];
}, Bh = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return $h;
  var t = zh(e), o = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - o + t[2] - t[0])
  };
}, Hh = Kl(), ft = "data-scroll-locked", Wh = function(e, t, o, r) {
  var n = e.left, a = e.top, l = e.right, i = e.gap;
  return o === void 0 && (o = "margin"), `
  .`.concat(Sh, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(i, "px ").concat(r, `;
  }
  body[`).concat(ft, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    o === "margin" && `
    padding-left: `.concat(n, `px;
    padding-top: `).concat(a, `px;
    padding-right: `).concat(l, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(i, "px ").concat(r, `;
    `),
    o === "padding" && "padding-right: ".concat(i, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(uo, ` {
    right: `).concat(i, "px ").concat(r, `;
  }
  
  .`).concat(fo, ` {
    margin-right: `).concat(i, "px ").concat(r, `;
  }
  
  .`).concat(uo, " .").concat(uo, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(fo, " .").concat(fo, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(ft, `] {
    `).concat(Rh, ": ").concat(i, `px;
  }
`);
}, Oa = function() {
  var e = parseInt(document.body.getAttribute(ft) || "0", 10);
  return isFinite(e) ? e : 0;
}, Gh = function() {
  s.useEffect(function() {
    return document.body.setAttribute(ft, (Oa() + 1).toString()), function() {
      var e = Oa() - 1;
      e <= 0 ? document.body.removeAttribute(ft) : document.body.setAttribute(ft, e.toString());
    };
  }, []);
}, Vh = function(e) {
  var t = e.noRelative, o = e.noImportant, r = e.gapMode, n = r === void 0 ? "margin" : r;
  Gh();
  var a = s.useMemo(function() {
    return Bh(n);
  }, [n]);
  return s.createElement(Hh, { styles: Wh(a, !t, n, o ? "" : "!important") });
}, Dr = !1;
if (typeof window < "u")
  try {
    var so = Object.defineProperty({}, "passive", {
      get: function() {
        return Dr = !0, !0;
      }
    });
    window.addEventListener("test", so, so), window.removeEventListener("test", so, so);
  } catch {
    Dr = !1;
  }
var lt = Dr ? { passive: !1 } : !1, Uh = function(e) {
  return e.tagName === "TEXTAREA";
}, jl = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var o = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    o[t] !== "hidden" && // contains scroll inside self
    !(o.overflowY === o.overflowX && !Uh(e) && o[t] === "visible")
  );
}, Kh = function(e) {
  return jl(e, "overflowY");
}, jh = function(e) {
  return jl(e, "overflowX");
}, Fa = function(e, t) {
  var o = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var n = Yl(e, r);
    if (n) {
      var a = Xl(e, r), l = a[1], i = a[2];
      if (l > i)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== o.body);
  return !1;
}, Yh = function(e) {
  var t = e.scrollTop, o = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    o,
    r
  ];
}, Xh = function(e) {
  var t = e.scrollLeft, o = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    o,
    r
  ];
}, Yl = function(e, t) {
  return e === "v" ? Kh(t) : jh(t);
}, Xl = function(e, t) {
  return e === "v" ? Yh(t) : Xh(t);
}, qh = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, Zh = function(e, t, o, r, n) {
  var a = qh(e, window.getComputedStyle(t).direction), l = a * r, i = o.target, u = t.contains(i), p = !1, f = l > 0, d = 0, v = 0;
  do {
    if (!i)
      break;
    var h = Xl(e, i), g = h[0], m = h[1], b = h[2], w = m - b - a * g;
    (g || w) && Yl(e, i) && (d += w, v += g);
    var y = i.parentNode;
    i = y && y.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? y.host : y;
  } while (
    // portaled content
    !u && i !== document.body || // self content
    u && (t.contains(i) || t === i)
  );
  return (f && Math.abs(d) < 1 || !f && Math.abs(v) < 1) && (p = !0), p;
}, lo = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, La = function(e) {
  return [e.deltaX, e.deltaY];
}, $a = function(e) {
  return e && "current" in e ? e.current : e;
}, Qh = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, Jh = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, eg = 0, it = [];
function tg(e) {
  var t = s.useRef([]), o = s.useRef([0, 0]), r = s.useRef(), n = s.useState(eg++)[0], a = s.useState(Kl)[0], l = s.useRef(e);
  s.useEffect(function() {
    l.current = e;
  }, [e]), s.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(n));
      var m = Ch([e.lockRef.current], (e.shards || []).map($a), !0).filter(Boolean);
      return m.forEach(function(b) {
        return b.classList.add("allow-interactivity-".concat(n));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(n)), m.forEach(function(b) {
          return b.classList.remove("allow-interactivity-".concat(n));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var i = s.useCallback(function(m, b) {
    if ("touches" in m && m.touches.length === 2 || m.type === "wheel" && m.ctrlKey)
      return !l.current.allowPinchZoom;
    var w = lo(m), y = o.current, x = "deltaX" in m ? m.deltaX : y[0] - w[0], C = "deltaY" in m ? m.deltaY : y[1] - w[1], R, E = m.target, P = Math.abs(x) > Math.abs(C) ? "h" : "v";
    if ("touches" in m && P === "h" && E.type === "range")
      return !1;
    var I = window.getSelection(), _ = I && I.anchorNode, D = _ ? _ === E || _.contains(E) : !1;
    if (D)
      return !1;
    var F = Fa(P, E);
    if (!F)
      return !0;
    if (F ? R = P : (R = P === "v" ? "h" : "v", F = Fa(P, E)), !F)
      return !1;
    if (!r.current && "changedTouches" in m && (x || C) && (r.current = R), !R)
      return !0;
    var T = r.current || R;
    return Zh(T, b, m, T === "h" ? x : C);
  }, []), u = s.useCallback(function(m) {
    var b = m;
    if (!(!it.length || it[it.length - 1] !== a)) {
      var w = "deltaY" in b ? La(b) : lo(b), y = t.current.filter(function(R) {
        return R.name === b.type && (R.target === b.target || b.target === R.shadowParent) && Qh(R.delta, w);
      })[0];
      if (y && y.should) {
        b.cancelable && b.preventDefault();
        return;
      }
      if (!y) {
        var x = (l.current.shards || []).map($a).filter(Boolean).filter(function(R) {
          return R.contains(b.target);
        }), C = x.length > 0 ? i(b, x[0]) : !l.current.noIsolation;
        C && b.cancelable && b.preventDefault();
      }
    }
  }, []), p = s.useCallback(function(m, b, w, y) {
    var x = { name: m, delta: b, target: w, should: y, shadowParent: og(w) };
    t.current.push(x), setTimeout(function() {
      t.current = t.current.filter(function(C) {
        return C !== x;
      });
    }, 1);
  }, []), f = s.useCallback(function(m) {
    o.current = lo(m), r.current = void 0;
  }, []), d = s.useCallback(function(m) {
    p(m.type, La(m), m.target, i(m, e.lockRef.current));
  }, []), v = s.useCallback(function(m) {
    p(m.type, lo(m), m.target, i(m, e.lockRef.current));
  }, []);
  s.useEffect(function() {
    return it.push(a), e.setCallbacks({
      onScrollCapture: d,
      onWheelCapture: d,
      onTouchMoveCapture: v
    }), document.addEventListener("wheel", u, lt), document.addEventListener("touchmove", u, lt), document.addEventListener("touchstart", f, lt), function() {
      it = it.filter(function(m) {
        return m !== a;
      }), document.removeEventListener("wheel", u, lt), document.removeEventListener("touchmove", u, lt), document.removeEventListener("touchstart", f, lt);
    };
  }, []);
  var h = e.removeScrollBar, g = e.inert;
  return s.createElement(
    s.Fragment,
    null,
    g ? s.createElement(a, { styles: Jh(n) }) : null,
    h ? s.createElement(Vh, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function og(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const rg = Mh(Ul, tg);
var Ut = s.forwardRef(function(e, t) {
  return s.createElement(Vo, Se({}, e, { ref: t, sideCar: rg }));
});
Ut.classNames = Vo.classNames;
var Uo = "Popover", [ql] = J(Uo, [
  Me
]), Kt = Me(), [ng, Ye] = ql(Uo), Zl = (e) => {
  const {
    __scopePopover: t,
    children: o,
    open: r,
    defaultOpen: n,
    onOpenChange: a,
    modal: l = !1
  } = e, i = Kt(t), u = s.useRef(null), [p, f] = s.useState(!1), [d, v] = oe({
    prop: r,
    defaultProp: n ?? !1,
    onChange: a,
    caller: Uo
  });
  return /* @__PURE__ */ c(St, { ...i, children: /* @__PURE__ */ c(
    ng,
    {
      scope: t,
      contentId: ne(),
      triggerRef: u,
      open: d,
      onOpenChange: v,
      onOpenToggle: s.useCallback(() => v((h) => !h), [v]),
      hasCustomAnchor: p,
      onCustomAnchorAdd: s.useCallback(() => f(!0), []),
      onCustomAnchorRemove: s.useCallback(() => f(!1), []),
      modal: l,
      children: o
    }
  ) });
};
Zl.displayName = Uo;
var Ql = "PopoverAnchor", Jl = s.forwardRef(
  (e, t) => {
    const { __scopePopover: o, ...r } = e, n = Ye(Ql, o), a = Kt(o), { onCustomAnchorAdd: l, onCustomAnchorRemove: i } = n;
    return s.useEffect(() => (l(), () => i()), [l, i]), /* @__PURE__ */ c(Rt, { ...a, ...r, ref: t });
  }
);
Jl.displayName = Ql;
var ei = "PopoverTrigger", ti = s.forwardRef(
  (e, t) => {
    const { __scopePopover: o, ...r } = e, n = Ye(ei, o), a = Kt(o), l = L(t, n.triggerRef), i = /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": n.open,
        "aria-controls": n.open ? n.contentId : void 0,
        "data-state": si(n.open),
        ...r,
        ref: l,
        onClick: N(e.onClick, n.onOpenToggle)
      }
    );
    return n.hasCustomAnchor ? i : /* @__PURE__ */ c(Rt, { asChild: !0, ...a, children: i });
  }
);
ti.displayName = ei;
var Nn = "PopoverPortal", [ag, sg] = ql(Nn, {
  forceMount: void 0
}), oi = (e) => {
  const { __scopePopover: t, forceMount: o, children: r, container: n } = e, a = Ye(Nn, t);
  return /* @__PURE__ */ c(ag, { scope: t, forceMount: o, children: /* @__PURE__ */ c(ee, { present: o || a.open, children: /* @__PURE__ */ c(ot, { asChild: !0, container: n, children: r }) }) });
};
oi.displayName = Nn;
var mt = "PopoverContent", ri = s.forwardRef(
  (e, t) => {
    const o = sg(mt, e.__scopePopover), { forceMount: r = o.forceMount, ...n } = e, a = Ye(mt, e.__scopePopover);
    return /* @__PURE__ */ c(ee, { present: r || a.open, children: a.modal ? /* @__PURE__ */ c(ig, { ...n, ref: t }) : /* @__PURE__ */ c(cg, { ...n, ref: t }) });
  }
);
ri.displayName = mt;
var lg = /* @__PURE__ */ Ge("PopoverContent.RemoveScroll"), ig = s.forwardRef(
  (e, t) => {
    const o = Ye(mt, e.__scopePopover), r = s.useRef(null), n = L(t, r), a = s.useRef(!1);
    return s.useEffect(() => {
      const l = r.current;
      if (l) return Go(l);
    }, []), /* @__PURE__ */ c(Ut, { as: lg, allowPinchZoom: !0, children: /* @__PURE__ */ c(
      ni,
      {
        ...e,
        ref: n,
        trapFocus: o.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: N(e.onCloseAutoFocus, (l) => {
          var i;
          l.preventDefault(), a.current || (i = o.triggerRef.current) == null || i.focus();
        }),
        onPointerDownOutside: N(
          e.onPointerDownOutside,
          (l) => {
            const i = l.detail.originalEvent, u = i.button === 0 && i.ctrlKey === !0, p = i.button === 2 || u;
            a.current = p;
          },
          { checkForDefaultPrevented: !1 }
        ),
        onFocusOutside: N(
          e.onFocusOutside,
          (l) => l.preventDefault(),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
), cg = s.forwardRef(
  (e, t) => {
    const o = Ye(mt, e.__scopePopover), r = s.useRef(!1), n = s.useRef(!1);
    return /* @__PURE__ */ c(
      ni,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          var l, i;
          (l = e.onCloseAutoFocus) == null || l.call(e, a), a.defaultPrevented || (r.current || (i = o.triggerRef.current) == null || i.focus(), a.preventDefault()), r.current = !1, n.current = !1;
        },
        onInteractOutside: (a) => {
          var u, p;
          (u = e.onInteractOutside) == null || u.call(e, a), a.defaultPrevented || (r.current = !0, a.detail.originalEvent.type === "pointerdown" && (n.current = !0));
          const l = a.target;
          ((p = o.triggerRef.current) == null ? void 0 : p.contains(l)) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && n.current && a.preventDefault();
        }
      }
    );
  }
), ni = s.forwardRef(
  (e, t) => {
    const {
      __scopePopover: o,
      trapFocus: r,
      onOpenAutoFocus: n,
      onCloseAutoFocus: a,
      disableOutsidePointerEvents: l,
      onEscapeKeyDown: i,
      onPointerDownOutside: u,
      onFocusOutside: p,
      onInteractOutside: f,
      ...d
    } = e, v = Ye(mt, o), h = Kt(o);
    return $o(), /* @__PURE__ */ c(
      Ht,
      {
        asChild: !0,
        loop: !0,
        trapped: r,
        onMountAutoFocus: n,
        onUnmountAutoFocus: a,
        children: /* @__PURE__ */ c(
          tt,
          {
            asChild: !0,
            disableOutsidePointerEvents: l,
            onInteractOutside: f,
            onEscapeKeyDown: i,
            onPointerDownOutside: u,
            onFocusOutside: p,
            onDismiss: () => v.onOpenChange(!1),
            deferPointerDownOutside: !0,
            children: /* @__PURE__ */ c(
              Gt,
              {
                "data-state": si(v.open),
                role: "dialog",
                id: v.contentId,
                ...h,
                ...d,
                ref: t,
                style: {
                  ...d.style,
                  "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)",
                  "--radix-popover-content-available-width": "var(--radix-popper-available-width)",
                  "--radix-popover-content-available-height": "var(--radix-popper-available-height)",
                  "--radix-popover-trigger-width": "var(--radix-popper-anchor-width)",
                  "--radix-popover-trigger-height": "var(--radix-popper-anchor-height)"
                }
              }
            )
          }
        )
      }
    );
  }
), ai = "PopoverClose", ug = s.forwardRef(
  (e, t) => {
    const { __scopePopover: o, ...r } = e, n = Ye(ai, o);
    return /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: N(e.onClick, () => n.onOpenChange(!1))
      }
    );
  }
);
ug.displayName = ai;
var dg = "PopoverArrow", fg = s.forwardRef(
  (e, t) => {
    const { __scopePopover: o, ...r } = e, n = Kt(o);
    return /* @__PURE__ */ c(Vt, { ...n, ...r, ref: t });
  }
);
fg.displayName = dg;
function si(e) {
  return e ? "open" : "closed";
}
var pg = Zl, vg = Jl, mg = ti, hg = oi, li = ri;
const gg = pg, bg = mg, N0 = vg, ii = s.forwardRef(({ className: e, align: t = "center", sideOffset: o = 4, ...r }, n) => /* @__PURE__ */ c(hg, { children: /* @__PURE__ */ c(
  li,
  {
    ref: n,
    align: t,
    sideOffset: o,
    className: S(
      "z-50 w-72 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-4 text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...r
  }
) }));
ii.displayName = li.displayName;
var ci = Object.freeze({
  // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
  position: "absolute",
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal"
}), yg = "VisuallyHidden", ui = s.forwardRef(
  (e, t) => /* @__PURE__ */ c(
    M.span,
    {
      ...e,
      ref: t,
      style: { ...ci, ...e.style }
    }
  )
);
ui.displayName = yg;
var wg = ui, [Ko] = J("Tooltip", [
  Me
]), jo = Me(), di = "TooltipProvider", xg = 700, kr = "tooltip.open", [Cg, En] = Ko(di), fi = (e) => {
  const {
    __scopeTooltip: t,
    delayDuration: o = xg,
    skipDelayDuration: r = 300,
    disableHoverableContent: n = !1,
    children: a
  } = e, l = s.useRef(!0), i = s.useRef(!1), u = s.useRef(0);
  return s.useEffect(() => {
    const p = u.current;
    return () => window.clearTimeout(p);
  }, []), /* @__PURE__ */ c(
    Cg,
    {
      scope: t,
      isOpenDelayedRef: l,
      delayDuration: o,
      onOpen: s.useCallback(() => {
        r <= 0 || (window.clearTimeout(u.current), l.current = !1);
      }, [r]),
      onClose: s.useCallback(() => {
        r <= 0 || (window.clearTimeout(u.current), u.current = window.setTimeout(
          () => l.current = !0,
          r
        ));
      }, [r]),
      isPointerInTransitRef: i,
      onPointerInTransitChange: s.useCallback((p) => {
        i.current = p;
      }, []),
      disableHoverableContent: n,
      children: a
    }
  );
};
fi.displayName = di;
var Dt = "Tooltip", [Sg, jt] = Ko(Dt), pi = (e) => {
  const {
    __scopeTooltip: t,
    children: o,
    open: r,
    defaultOpen: n,
    onOpenChange: a,
    disableHoverableContent: l,
    delayDuration: i
  } = e, u = En(Dt, e.__scopeTooltip), p = jo(t), [f, d] = s.useState(null), v = ne(), h = s.useRef(0), g = l ?? u.disableHoverableContent, m = i ?? u.delayDuration, b = s.useRef(!1), [w, y] = oe({
    prop: r,
    defaultProp: n ?? !1,
    onChange: (P) => {
      P ? (u.onOpen(), document.dispatchEvent(new CustomEvent(kr))) : u.onClose(), a == null || a(P);
    },
    caller: Dt
  }), x = s.useMemo(() => w ? b.current ? "delayed-open" : "instant-open" : "closed", [w]), C = s.useCallback(() => {
    window.clearTimeout(h.current), h.current = 0, b.current = !1, y(!0);
  }, [y]), R = s.useCallback(() => {
    window.clearTimeout(h.current), h.current = 0, y(!1);
  }, [y]), E = s.useCallback(() => {
    window.clearTimeout(h.current), h.current = window.setTimeout(() => {
      b.current = !0, y(!0), h.current = 0;
    }, m);
  }, [m, y]);
  return s.useEffect(() => () => {
    h.current && (window.clearTimeout(h.current), h.current = 0);
  }, []), /* @__PURE__ */ c(St, { ...p, children: /* @__PURE__ */ c(
    Sg,
    {
      scope: t,
      contentId: v,
      open: w,
      stateAttribute: x,
      trigger: f,
      onTriggerChange: d,
      onTriggerEnter: s.useCallback(() => {
        u.isOpenDelayedRef.current ? E() : C();
      }, [u.isOpenDelayedRef, E, C]),
      onTriggerLeave: s.useCallback(() => {
        g ? R() : (window.clearTimeout(h.current), h.current = 0);
      }, [R, g]),
      onOpen: C,
      onClose: R,
      disableHoverableContent: g,
      children: o
    }
  ) });
};
pi.displayName = Dt;
var Or = "TooltipTrigger", vi = s.forwardRef(
  (e, t) => {
    const { __scopeTooltip: o, ...r } = e, n = jt(Or, o), a = En(Or, o), l = jo(o), i = s.useRef(null), u = L(t, i, n.onTriggerChange), p = s.useRef(!1), f = s.useRef(!1), d = s.useCallback(() => p.current = !1, []);
    return s.useEffect(() => () => document.removeEventListener("pointerup", d), [d]), /* @__PURE__ */ c(Rt, { asChild: !0, ...l, children: /* @__PURE__ */ c(
      M.button,
      {
        "aria-describedby": n.open ? n.contentId : void 0,
        "data-state": n.stateAttribute,
        ...r,
        ref: u,
        onPointerMove: N(e.onPointerMove, (v) => {
          v.pointerType !== "touch" && !f.current && !a.isPointerInTransitRef.current && (n.onTriggerEnter(), f.current = !0);
        }),
        onPointerLeave: N(e.onPointerLeave, () => {
          n.onTriggerLeave(), f.current = !1;
        }),
        onPointerDown: N(e.onPointerDown, () => {
          n.open && n.onClose(), p.current = !0, document.addEventListener("pointerup", d, { once: !0 });
        }),
        onFocus: N(e.onFocus, () => {
          p.current || n.onOpen();
        }),
        onBlur: N(e.onBlur, n.onClose),
        onClick: N(e.onClick, n.onClose)
      }
    ) });
  }
);
vi.displayName = Or;
var Pn = "TooltipPortal", [Rg, Ng] = Ko(Pn, {
  forceMount: void 0
}), mi = (e) => {
  const { __scopeTooltip: t, forceMount: o, children: r, container: n } = e, a = jt(Pn, t);
  return /* @__PURE__ */ c(Rg, { scope: t, forceMount: o, children: /* @__PURE__ */ c(ee, { present: o || a.open, children: /* @__PURE__ */ c(ot, { asChild: !0, container: n, children: r }) }) });
};
mi.displayName = Pn;
var ht = "TooltipContent", hi = s.forwardRef(
  (e, t) => {
    const o = Ng(ht, e.__scopeTooltip), { forceMount: r = o.forceMount, side: n = "top", ...a } = e, l = jt(ht, e.__scopeTooltip);
    return /* @__PURE__ */ c(ee, { present: r || l.open, children: l.disableHoverableContent ? /* @__PURE__ */ c(gi, { side: n, ...a, ref: t }) : /* @__PURE__ */ c(Eg, { side: n, ...a, ref: t }) });
  }
), Eg = s.forwardRef((e, t) => {
  const o = jt(ht, e.__scopeTooltip), r = En(ht, e.__scopeTooltip), n = s.useRef(null), a = L(t, n), [l, i] = s.useState(null), { trigger: u, onClose: p } = o, f = n.current, { onPointerInTransitChange: d } = r, v = s.useCallback(() => {
    i(null), d(!1);
  }, [d]), h = s.useCallback(
    (g, m) => {
      const b = g.currentTarget, w = { x: g.clientX, y: g.clientY }, y = Mg(w, b.getBoundingClientRect()), x = Ig(w, y), C = Dg(m.getBoundingClientRect()), R = Og([...x, ...C]);
      i(R), d(!0);
    },
    [d]
  );
  return s.useEffect(() => () => v(), [v]), s.useEffect(() => {
    if (u && f) {
      const g = (b) => h(b, f), m = (b) => h(b, u);
      return u.addEventListener("pointerleave", g), f.addEventListener("pointerleave", m), () => {
        u.removeEventListener("pointerleave", g), f.removeEventListener("pointerleave", m);
      };
    }
  }, [u, f, h, v]), s.useEffect(() => {
    if (l) {
      const g = (m) => {
        const b = m.target, w = { x: m.clientX, y: m.clientY }, y = (u == null ? void 0 : u.contains(b)) || (f == null ? void 0 : f.contains(b)), x = !kg(w, l);
        y ? v() : x && (v(), p());
      };
      return document.addEventListener("pointermove", g), () => document.removeEventListener("pointermove", g);
    }
  }, [u, f, l, p, v]), /* @__PURE__ */ c(gi, { ...e, ref: a });
}), [Pg, Ag] = Ko(Dt, { isInside: !1 }), _g = /* @__PURE__ */ op("TooltipContent"), gi = s.forwardRef(
  (e, t) => {
    const {
      __scopeTooltip: o,
      children: r,
      "aria-label": n,
      onEscapeKeyDown: a,
      onPointerDownOutside: l,
      ...i
    } = e, u = jt(ht, o), p = jo(o), { onClose: f } = u;
    return s.useEffect(() => (document.addEventListener(kr, f), () => document.removeEventListener(kr, f)), [f]), s.useEffect(() => {
      if (u.trigger) {
        const d = (v) => {
          v.target instanceof Node && v.target.contains(u.trigger) && f();
        };
        return window.addEventListener("scroll", d, { capture: !0 }), () => window.removeEventListener("scroll", d, { capture: !0 });
      }
    }, [u.trigger, f]), /* @__PURE__ */ c(
      tt,
      {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: a,
        onPointerDownOutside: l,
        onFocusOutside: (d) => d.preventDefault(),
        onDismiss: f,
        children: /* @__PURE__ */ O(
          Gt,
          {
            "data-state": u.stateAttribute,
            ...p,
            ...i,
            ref: t,
            style: {
              ...i.style,
              "--radix-tooltip-content-transform-origin": "var(--radix-popper-transform-origin)",
              "--radix-tooltip-content-available-width": "var(--radix-popper-available-width)",
              "--radix-tooltip-content-available-height": "var(--radix-popper-available-height)",
              "--radix-tooltip-trigger-width": "var(--radix-popper-anchor-width)",
              "--radix-tooltip-trigger-height": "var(--radix-popper-anchor-height)"
            },
            children: [
              /* @__PURE__ */ c(_g, { children: r }),
              /* @__PURE__ */ c(Pg, { scope: o, isInside: !0, children: /* @__PURE__ */ c(wg, { id: u.contentId, role: "tooltip", children: n || r }) })
            ]
          }
        )
      }
    );
  }
);
hi.displayName = ht;
var bi = "TooltipArrow", Tg = s.forwardRef(
  (e, t) => {
    const { __scopeTooltip: o, ...r } = e, n = jo(o);
    return Ag(
      bi,
      o
    ).isInside ? null : /* @__PURE__ */ c(Vt, { ...n, ...r, ref: t });
  }
);
Tg.displayName = bi;
function Mg(e, t) {
  const o = Math.abs(t.top - e.y), r = Math.abs(t.bottom - e.y), n = Math.abs(t.right - e.x), a = Math.abs(t.left - e.x);
  switch (Math.min(o, r, n, a)) {
    case a:
      return "left";
    case n:
      return "right";
    case o:
      return "top";
    case r:
      return "bottom";
    default:
      throw new Error("unreachable");
  }
}
function Ig(e, t, o = 5) {
  const r = [];
  switch (t) {
    case "top":
      r.push(
        { x: e.x - o, y: e.y + o },
        { x: e.x + o, y: e.y + o }
      );
      break;
    case "bottom":
      r.push(
        { x: e.x - o, y: e.y - o },
        { x: e.x + o, y: e.y - o }
      );
      break;
    case "left":
      r.push(
        { x: e.x + o, y: e.y - o },
        { x: e.x + o, y: e.y + o }
      );
      break;
    case "right":
      r.push(
        { x: e.x - o, y: e.y - o },
        { x: e.x - o, y: e.y + o }
      );
      break;
  }
  return r;
}
function Dg(e) {
  const { top: t, right: o, bottom: r, left: n } = e;
  return [
    { x: n, y: t },
    { x: o, y: t },
    { x: o, y: r },
    { x: n, y: r }
  ];
}
function kg(e, t) {
  const { x: o, y: r } = e;
  let n = !1;
  for (let a = 0, l = t.length - 1; a < t.length; l = a++) {
    const i = t[a], u = t[l], p = i.x, f = i.y, d = u.x, v = u.y;
    f > r != v > r && o < (d - p) * (r - f) / (v - f) + p && (n = !n);
  }
  return n;
}
function Og(e) {
  const t = e.slice();
  return t.sort((o, r) => o.x < r.x ? -1 : o.x > r.x ? 1 : o.y < r.y ? -1 : o.y > r.y ? 1 : 0), Fg(t);
}
function Fg(e) {
  if (e.length <= 1) return e.slice();
  const t = [];
  for (let r = 0; r < e.length; r++) {
    const n = e[r];
    for (; t.length >= 2; ) {
      const a = t[t.length - 1], l = t[t.length - 2];
      if ((a.x - l.x) * (n.y - l.y) >= (a.y - l.y) * (n.x - l.x)) t.pop();
      else break;
    }
    t.push(n);
  }
  t.pop();
  const o = [];
  for (let r = e.length - 1; r >= 0; r--) {
    const n = e[r];
    for (; o.length >= 2; ) {
      const a = o[o.length - 1], l = o[o.length - 2];
      if ((a.x - l.x) * (n.y - l.y) >= (a.y - l.y) * (n.x - l.x)) o.pop();
      else break;
    }
    o.push(n);
  }
  return o.pop(), t.length === 1 && o.length === 1 && t[0].x === o[0].x && t[0].y === o[0].y ? t : t.concat(o);
}
var Lg = fi, $g = pi, zg = vi, Bg = mi, yi = hi;
const E0 = Lg, P0 = $g, A0 = zg, Hg = s.forwardRef(({ className: e, sideOffset: t = 4, ...o }, r) => /* @__PURE__ */ c(Bg, { children: /* @__PURE__ */ c(
  yi,
  {
    ref: r,
    sideOffset: t,
    className: S(
      "z-50 overflow-hidden rounded-md border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] px-3 py-1.5 text-xs text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...o
  }
) }));
Hg.displayName = yi.displayName;
var Fr = ["Enter", " "], Wg = ["ArrowDown", "PageUp", "Home"], wi = ["ArrowUp", "PageDown", "End"], Gg = [...Wg, ...wi], Vg = {
  ltr: [...Fr, "ArrowRight"],
  rtl: [...Fr, "ArrowLeft"]
}, Ug = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
}, Yt = "Menu", [kt, Kg, jg] = yt(Yt), [rt, An] = J(Yt, [
  jg,
  Me,
  Ae
]), Xt = Me(), xi = Ae(), [Ci, Xe] = rt(Yt), [Yg, qt] = rt(Yt), Si = (e) => {
  const { __scopeMenu: t, open: o = !1, children: r, dir: n, onOpenChange: a, modal: l = !0 } = e, i = Xt(t), [u, p] = s.useState(null), f = s.useRef(!1), d = ae(a), v = Pe(n);
  return s.useEffect(() => {
    const h = () => {
      f.current = !0, document.addEventListener("pointerdown", g, { capture: !0, once: !0 }), document.addEventListener("pointermove", g, { capture: !0, once: !0 });
    }, g = () => f.current = !1;
    return document.addEventListener("keydown", h, { capture: !0 }), () => {
      document.removeEventListener("keydown", h, { capture: !0 }), document.removeEventListener("pointerdown", g, { capture: !0 }), document.removeEventListener("pointermove", g, { capture: !0 });
    };
  }, []), s.useEffect(() => {
    if (!o)
      return;
    const h = () => d(!1);
    return window.addEventListener("blur", h), () => window.removeEventListener("blur", h);
  }, [o, d]), /* @__PURE__ */ c(St, { ...i, children: /* @__PURE__ */ c(
    Ci,
    {
      scope: t,
      open: o,
      onOpenChange: d,
      content: u,
      onContentChange: p,
      children: /* @__PURE__ */ c(
        Yg,
        {
          scope: t,
          onClose: s.useCallback(() => d(!1), [d]),
          isUsingKeyboardRef: f,
          dir: v,
          modal: l,
          children: r
        }
      )
    }
  ) });
};
Si.displayName = Yt;
var Xg = "MenuAnchor", _n = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, ...r } = e, n = Xt(o);
    return /* @__PURE__ */ c(Rt, { ...n, ...r, ref: t });
  }
);
_n.displayName = Xg;
var Tn = "MenuPortal", [qg, Ri] = rt(Tn, {
  forceMount: void 0
}), Ni = (e) => {
  const { __scopeMenu: t, forceMount: o, children: r, container: n } = e, a = Xe(Tn, t);
  return /* @__PURE__ */ c(qg, { scope: t, forceMount: o, children: /* @__PURE__ */ c(ee, { present: o || a.open, children: /* @__PURE__ */ c(ot, { asChild: !0, container: n, children: r }) }) });
};
Ni.displayName = Tn;
var ve = "MenuContent", [Zg, Mn] = rt(ve), Ei = s.forwardRef(
  (e, t) => {
    const o = Ri(ve, e.__scopeMenu), { forceMount: r = o.forceMount, ...n } = e, a = Xe(ve, e.__scopeMenu), l = qt(ve, e.__scopeMenu);
    return /* @__PURE__ */ c(kt.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ c(ee, { present: r || a.open, children: /* @__PURE__ */ c(kt.Slot, { scope: e.__scopeMenu, children: l.modal ? /* @__PURE__ */ c(Qg, { ...n, ref: t }) : /* @__PURE__ */ c(Jg, { ...n, ref: t }) }) }) });
  }
), Qg = s.forwardRef(
  (e, t) => {
    const o = Xe(ve, e.__scopeMenu), r = s.useRef(null), n = L(t, r);
    return s.useEffect(() => {
      const a = r.current;
      if (a) return Go(a);
    }, []), /* @__PURE__ */ c(
      In,
      {
        ...e,
        ref: n,
        trapFocus: o.open,
        disableOutsidePointerEvents: o.open,
        disableOutsideScroll: !0,
        onFocusOutside: N(
          e.onFocusOutside,
          (a) => a.preventDefault(),
          { checkForDefaultPrevented: !1 }
        ),
        onDismiss: () => o.onOpenChange(!1)
      }
    );
  }
), Jg = s.forwardRef((e, t) => {
  const o = Xe(ve, e.__scopeMenu);
  return /* @__PURE__ */ c(
    In,
    {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => o.onOpenChange(!1)
    }
  );
}), eb = /* @__PURE__ */ Ge("MenuContent.ScrollLock"), In = s.forwardRef(
  (e, t) => {
    const {
      __scopeMenu: o,
      loop: r = !1,
      trapFocus: n,
      onOpenAutoFocus: a,
      onCloseAutoFocus: l,
      disableOutsidePointerEvents: i,
      onEntryFocus: u,
      onEscapeKeyDown: p,
      onPointerDownOutside: f,
      onFocusOutside: d,
      onInteractOutside: v,
      onDismiss: h,
      disableOutsideScroll: g,
      ...m
    } = e, b = Xe(ve, o), w = qt(ve, o), y = Xt(o), x = xi(o), C = Kg(o), [R, E] = s.useState(null), P = s.useRef(null), I = L(t, P, b.onContentChange), _ = s.useRef(0), D = s.useRef(""), F = s.useRef(0), T = s.useRef(null), H = s.useRef("right"), B = s.useRef(0), U = g ? Ut : s.Fragment, z = g ? { as: eb, allowPinchZoom: !0 } : void 0, G = (A) => {
      var $, X;
      const V = D.current + A, K = C().filter((Z) => !Z.disabled), te = document.activeElement, fe = ($ = K.find((Z) => Z.ref.current === te)) == null ? void 0 : $.textValue, pe = K.map((Z) => Z.textValue), Ie = fb(pe, V, fe), ie = (X = K.find((Z) => Z.textValue === Ie)) == null ? void 0 : X.ref.current;
      (function Z(Y) {
        D.current = Y, window.clearTimeout(_.current), Y !== "" && (_.current = window.setTimeout(() => Z(""), 1e3));
      })(V), ie && setTimeout(() => ie.focus());
    };
    s.useEffect(() => () => window.clearTimeout(_.current), []), $o();
    const k = s.useCallback((A) => {
      var K, te;
      return H.current === ((K = T.current) == null ? void 0 : K.side) && vb(A, (te = T.current) == null ? void 0 : te.area);
    }, []);
    return /* @__PURE__ */ c(
      Zg,
      {
        scope: o,
        searchRef: D,
        onItemEnter: s.useCallback(
          (A) => {
            k(A) && A.preventDefault();
          },
          [k]
        ),
        onItemLeave: s.useCallback(
          (A) => {
            var V;
            k(A) || ((V = P.current) == null || V.focus(), E(null));
          },
          [k]
        ),
        onTriggerLeave: s.useCallback(
          (A) => {
            k(A) && A.preventDefault();
          },
          [k]
        ),
        pointerGraceTimerRef: F,
        onPointerGraceIntentChange: s.useCallback((A) => {
          T.current = A;
        }, []),
        children: /* @__PURE__ */ c(U, { ...z, children: /* @__PURE__ */ c(
          Ht,
          {
            asChild: !0,
            trapped: n,
            onMountAutoFocus: N(a, (A) => {
              var V;
              A.preventDefault(), (V = P.current) == null || V.focus({ preventScroll: !0 });
            }),
            onUnmountAutoFocus: l,
            children: /* @__PURE__ */ c(
              tt,
              {
                asChild: !0,
                disableOutsidePointerEvents: i,
                onEscapeKeyDown: p,
                onPointerDownOutside: f,
                onFocusOutside: d,
                onInteractOutside: v,
                onDismiss: h,
                children: /* @__PURE__ */ c(
                  $t,
                  {
                    asChild: !0,
                    ...x,
                    dir: w.dir,
                    orientation: "vertical",
                    loop: r,
                    currentTabStopId: R,
                    onCurrentTabStopIdChange: E,
                    onEntryFocus: N(u, (A) => {
                      w.isUsingKeyboardRef.current || A.preventDefault();
                    }),
                    preventScrollOnEntryFocus: !0,
                    children: /* @__PURE__ */ c(
                      Gt,
                      {
                        role: "menu",
                        "aria-orientation": "vertical",
                        "data-state": Gi(b.open),
                        "data-radix-menu-content": "",
                        dir: w.dir,
                        ...y,
                        ...m,
                        ref: I,
                        style: { outline: "none", ...m.style },
                        onKeyDown: N(m.onKeyDown, (A) => {
                          const K = A.target.closest("[data-radix-menu-content]") === A.currentTarget, te = A.ctrlKey || A.altKey || A.metaKey, fe = A.key.length === 1;
                          K && (A.key === "Tab" && A.preventDefault(), !te && fe && G(A.key));
                          const pe = P.current;
                          if (A.target !== pe || !Gg.includes(A.key)) return;
                          A.preventDefault();
                          const ie = C().filter(($) => !$.disabled).map(($) => $.ref.current);
                          wi.includes(A.key) && ie.reverse(), ub(ie);
                        }),
                        onBlur: N(e.onBlur, (A) => {
                          A.currentTarget.contains(A.target) || (window.clearTimeout(_.current), D.current = "");
                        }),
                        onPointerMove: N(
                          e.onPointerMove,
                          Ot((A) => {
                            const V = A.target, K = B.current !== A.clientX;
                            if (A.currentTarget.contains(V) && K) {
                              const te = A.clientX > B.current ? "right" : "left";
                              H.current = te, B.current = A.clientX;
                            }
                          })
                        )
                      }
                    )
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
Ei.displayName = ve;
var tb = "MenuGroup", Dn = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, ...r } = e;
    return /* @__PURE__ */ c(M.div, { role: "group", ...r, ref: t });
  }
);
Dn.displayName = tb;
var ob = "MenuLabel", Pi = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, ...r } = e;
    return /* @__PURE__ */ c(M.div, { ...r, ref: t });
  }
);
Pi.displayName = ob;
var wo = "MenuItem", za = "menu.itemSelect", Yo = s.forwardRef(
  (e, t) => {
    const { disabled: o = !1, onSelect: r, ...n } = e, a = s.useRef(null), l = qt(wo, e.__scopeMenu), i = Mn(wo, e.__scopeMenu), u = L(t, a), p = s.useRef(!1), f = () => {
      const d = a.current;
      if (!o && d) {
        const v = new CustomEvent(za, { bubbles: !0, cancelable: !0 });
        d.addEventListener(za, (h) => r == null ? void 0 : r(h), { once: !0 }), ts(d, v), v.defaultPrevented ? p.current = !1 : l.onClose();
      }
    };
    return /* @__PURE__ */ c(
      Ai,
      {
        ...n,
        ref: u,
        disabled: o,
        onClick: N(e.onClick, f),
        onPointerDown: (d) => {
          var v;
          (v = e.onPointerDown) == null || v.call(e, d), p.current = !0;
        },
        onPointerUp: N(e.onPointerUp, (d) => {
          var v;
          p.current || (v = d.currentTarget) == null || v.click();
        }),
        onKeyDown: N(e.onKeyDown, (d) => {
          const v = i.searchRef.current !== "";
          o || v && d.key === " " || Fr.includes(d.key) && (d.currentTarget.click(), d.preventDefault());
        })
      }
    );
  }
);
Yo.displayName = wo;
var Ai = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, disabled: r = !1, textValue: n, ...a } = e, l = Mn(wo, o), i = xi(o), u = s.useRef(null), p = L(t, u), [f, d] = s.useState(!1), [v, h] = s.useState("");
    return s.useEffect(() => {
      const g = u.current;
      g && h((g.textContent ?? "").trim());
    }, [a.children]), /* @__PURE__ */ c(
      kt.ItemSlot,
      {
        scope: o,
        disabled: r,
        textValue: n ?? v,
        children: /* @__PURE__ */ c(zt, { asChild: !0, ...i, focusable: !r, children: /* @__PURE__ */ c(
          M.div,
          {
            role: "menuitem",
            "data-highlighted": f ? "" : void 0,
            "aria-disabled": r || void 0,
            "data-disabled": r ? "" : void 0,
            ...a,
            ref: p,
            onPointerMove: N(
              e.onPointerMove,
              Ot((g) => {
                r ? l.onItemLeave(g) : (l.onItemEnter(g), g.defaultPrevented || g.currentTarget.focus({ preventScroll: !0 }));
              })
            ),
            onPointerLeave: N(
              e.onPointerLeave,
              Ot((g) => l.onItemLeave(g))
            ),
            onFocus: N(e.onFocus, () => d(!0)),
            onBlur: N(e.onBlur, () => d(!1))
          }
        ) })
      }
    );
  }
), rb = "MenuCheckboxItem", _i = s.forwardRef(
  (e, t) => {
    const { checked: o = !1, onCheckedChange: r, ...n } = e;
    return /* @__PURE__ */ c(ki, { scope: e.__scopeMenu, checked: o, children: /* @__PURE__ */ c(
      Yo,
      {
        role: "menuitemcheckbox",
        "aria-checked": xo(o) ? "mixed" : o,
        ...n,
        ref: t,
        "data-state": Fn(o),
        onSelect: N(
          n.onSelect,
          () => r == null ? void 0 : r(xo(o) ? !0 : !o),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
_i.displayName = rb;
var Ti = "MenuRadioGroup", [nb, ab] = rt(
  Ti,
  { value: void 0, onValueChange: () => {
  } }
), Mi = s.forwardRef(
  (e, t) => {
    const { value: o, onValueChange: r, ...n } = e, a = ae(r);
    return /* @__PURE__ */ c(nb, { scope: e.__scopeMenu, value: o, onValueChange: a, children: /* @__PURE__ */ c(Dn, { ...n, ref: t }) });
  }
);
Mi.displayName = Ti;
var Ii = "MenuRadioItem", Di = s.forwardRef(
  (e, t) => {
    const { value: o, ...r } = e, n = ab(Ii, e.__scopeMenu), a = o === n.value;
    return /* @__PURE__ */ c(ki, { scope: e.__scopeMenu, checked: a, children: /* @__PURE__ */ c(
      Yo,
      {
        role: "menuitemradio",
        "aria-checked": a,
        ...r,
        ref: t,
        "data-state": Fn(a),
        onSelect: N(
          r.onSelect,
          () => {
            var l;
            return (l = n.onValueChange) == null ? void 0 : l.call(n, o);
          },
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
Di.displayName = Ii;
var kn = "MenuItemIndicator", [ki, sb] = rt(
  kn,
  { checked: !1 }
), Oi = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, forceMount: r, ...n } = e, a = sb(kn, o);
    return /* @__PURE__ */ c(
      ee,
      {
        present: r || xo(a.checked) || a.checked === !0,
        children: /* @__PURE__ */ c(
          M.span,
          {
            ...n,
            ref: t,
            "data-state": Fn(a.checked)
          }
        )
      }
    );
  }
);
Oi.displayName = kn;
var lb = "MenuSeparator", Fi = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, ...r } = e;
    return /* @__PURE__ */ c(
      M.div,
      {
        role: "separator",
        "aria-orientation": "horizontal",
        ...r,
        ref: t
      }
    );
  }
);
Fi.displayName = lb;
var ib = "MenuArrow", Li = s.forwardRef(
  (e, t) => {
    const { __scopeMenu: o, ...r } = e, n = Xt(o);
    return /* @__PURE__ */ c(Vt, { ...n, ...r, ref: t });
  }
);
Li.displayName = ib;
var On = "MenuSub", [cb, $i] = rt(On), zi = (e) => {
  const { __scopeMenu: t, children: o, open: r = !1, onOpenChange: n } = e, a = Xe(On, t), l = Xt(t), [i, u] = s.useState(null), [p, f] = s.useState(null), d = ae(n);
  return s.useEffect(() => (a.open === !1 && d(!1), () => d(!1)), [a.open, d]), /* @__PURE__ */ c(St, { ...l, children: /* @__PURE__ */ c(
    Ci,
    {
      scope: t,
      open: r,
      onOpenChange: d,
      content: p,
      onContentChange: f,
      children: /* @__PURE__ */ c(
        cb,
        {
          scope: t,
          contentId: ne(),
          triggerId: ne(),
          trigger: i,
          onTriggerChange: u,
          children: o
        }
      )
    }
  ) });
};
zi.displayName = On;
var _t = "MenuSubTrigger", Bi = s.forwardRef(
  (e, t) => {
    const o = Xe(_t, e.__scopeMenu), r = qt(_t, e.__scopeMenu), n = $i(_t, e.__scopeMenu), a = Mn(_t, e.__scopeMenu), l = s.useRef(null), { pointerGraceTimerRef: i, onPointerGraceIntentChange: u } = a, p = { __scopeMenu: e.__scopeMenu }, f = s.useCallback(() => {
      l.current && window.clearTimeout(l.current), l.current = null;
    }, []);
    return s.useEffect(() => f, [f]), s.useEffect(() => {
      const d = i.current;
      return () => {
        window.clearTimeout(d), u(null);
      };
    }, [i, u]), /* @__PURE__ */ c(_n, { asChild: !0, ...p, children: /* @__PURE__ */ c(
      Ai,
      {
        id: n.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": o.open,
        "aria-controls": o.open ? n.contentId : void 0,
        "data-state": Gi(o.open),
        ...e,
        ref: Kr(t, n.onTriggerChange),
        onClick: (d) => {
          var v;
          (v = e.onClick) == null || v.call(e, d), !(e.disabled || d.defaultPrevented) && (d.currentTarget.focus(), o.open || o.onOpenChange(!0));
        },
        onPointerMove: N(
          e.onPointerMove,
          Ot((d) => {
            a.onItemEnter(d), !d.defaultPrevented && !e.disabled && !o.open && !l.current && (a.onPointerGraceIntentChange(null), l.current = window.setTimeout(() => {
              o.onOpenChange(!0), f();
            }, 100));
          })
        ),
        onPointerLeave: N(
          e.onPointerLeave,
          Ot((d) => {
            var h, g;
            f();
            const v = (h = o.content) == null ? void 0 : h.getBoundingClientRect();
            if (v) {
              const m = (g = o.content) == null ? void 0 : g.dataset.side, b = m === "right", w = b ? -5 : 5, y = v[b ? "left" : "right"], x = v[b ? "right" : "left"];
              a.onPointerGraceIntentChange({
                area: [
                  // Apply a bleed on clientX to ensure that our exit point is
                  // consistently within polygon bounds
                  { x: d.clientX + w, y: d.clientY },
                  { x: y, y: v.top },
                  { x, y: v.top },
                  { x, y: v.bottom },
                  { x: y, y: v.bottom }
                ],
                side: m
              }), window.clearTimeout(i.current), i.current = window.setTimeout(
                () => a.onPointerGraceIntentChange(null),
                300
              );
            } else {
              if (a.onTriggerLeave(d), d.defaultPrevented) return;
              a.onPointerGraceIntentChange(null);
            }
          })
        ),
        onKeyDown: N(e.onKeyDown, (d) => {
          var h;
          const v = a.searchRef.current !== "";
          e.disabled || v && d.key === " " || Vg[r.dir].includes(d.key) && (o.onOpenChange(!0), (h = o.content) == null || h.focus(), d.preventDefault());
        })
      }
    ) });
  }
);
Bi.displayName = _t;
var Hi = "MenuSubContent", Wi = s.forwardRef(
  (e, t) => {
    const o = Ri(ve, e.__scopeMenu), { forceMount: r = o.forceMount, align: n = "start", ...a } = e, l = Xe(ve, e.__scopeMenu), i = qt(ve, e.__scopeMenu), u = $i(Hi, e.__scopeMenu), p = s.useRef(null), f = L(t, p);
    return /* @__PURE__ */ c(kt.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ c(ee, { present: r || l.open, children: /* @__PURE__ */ c(kt.Slot, { scope: e.__scopeMenu, children: /* @__PURE__ */ c(
      In,
      {
        id: u.contentId,
        "aria-labelledby": u.triggerId,
        ...a,
        ref: f,
        align: n,
        side: i.dir === "rtl" ? "left" : "right",
        disableOutsidePointerEvents: !1,
        disableOutsideScroll: !1,
        trapFocus: !1,
        onOpenAutoFocus: (d) => {
          var v;
          i.isUsingKeyboardRef.current && ((v = p.current) == null || v.focus()), d.preventDefault();
        },
        onCloseAutoFocus: (d) => d.preventDefault(),
        onFocusOutside: N(e.onFocusOutside, (d) => {
          d.target !== u.trigger && l.onOpenChange(!1);
        }),
        onEscapeKeyDown: N(e.onEscapeKeyDown, (d) => {
          i.onClose(), d.preventDefault();
        }),
        onKeyDown: N(e.onKeyDown, (d) => {
          var g;
          const v = d.currentTarget.contains(d.target), h = Ug[i.dir].includes(d.key);
          v && h && (l.onOpenChange(!1), (g = u.trigger) == null || g.focus(), d.preventDefault());
        })
      }
    ) }) }) });
  }
);
Wi.displayName = Hi;
function Gi(e) {
  return e ? "open" : "closed";
}
function xo(e) {
  return e === "indeterminate";
}
function Fn(e) {
  return xo(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function ub(e) {
  const t = document.activeElement;
  for (const o of e)
    if (o === t || (o.focus(), document.activeElement !== t)) return;
}
function db(e, t) {
  return e.map((o, r) => e[(t + r) % e.length]);
}
function fb(e, t, o) {
  const n = t.length > 1 && Array.from(t).every((p) => p === t[0]) ? t[0] : t, a = o ? e.indexOf(o) : -1;
  let l = db(e, Math.max(a, 0));
  n.length === 1 && (l = l.filter((p) => p !== o));
  const u = l.find(
    (p) => p.toLowerCase().startsWith(n.toLowerCase())
  );
  return u !== o ? u : void 0;
}
function pb(e, t) {
  const { x: o, y: r } = e;
  let n = !1;
  for (let a = 0, l = t.length - 1; a < t.length; l = a++) {
    const i = t[a], u = t[l], p = i.x, f = i.y, d = u.x, v = u.y;
    f > r != v > r && o < (d - p) * (r - f) / (v - f) + p && (n = !n);
  }
  return n;
}
function vb(e, t) {
  if (!t) return !1;
  const o = { x: e.clientX, y: e.clientY };
  return pb(o, t);
}
function Ot(e) {
  return (t) => t.pointerType === "mouse" ? e(t) : void 0;
}
var Vi = Si, Ui = _n, Ki = Ni, ji = Ei, Yi = Dn, Xi = Pi, qi = Yo, Zi = _i, Qi = Mi, Ji = Di, ec = Oi, tc = Fi, oc = Li, rc = zi, nc = Bi, ac = Wi, Xo = "DropdownMenu", [mb] = J(
  Xo,
  [An]
), se = An(), [hb, sc] = mb(Xo), lc = (e) => {
  const {
    __scopeDropdownMenu: t,
    children: o,
    dir: r,
    open: n,
    defaultOpen: a,
    onOpenChange: l,
    modal: i = !0
  } = e, u = se(t), p = s.useRef(null), [f, d] = oe({
    prop: n,
    defaultProp: a ?? !1,
    onChange: l,
    caller: Xo
  });
  return /* @__PURE__ */ c(
    hb,
    {
      scope: t,
      triggerId: ne(),
      triggerRef: p,
      contentId: ne(),
      open: f,
      onOpenChange: d,
      onOpenToggle: s.useCallback(() => d((v) => !v), [d]),
      modal: i,
      children: /* @__PURE__ */ c(Vi, { ...u, open: f, onOpenChange: d, dir: r, modal: i, children: o })
    }
  );
};
lc.displayName = Xo;
var ic = "DropdownMenuTrigger", cc = s.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: o, disabled: r = !1, ...n } = e, a = sc(ic, o), l = se(o);
    return /* @__PURE__ */ c(Ui, { asChild: !0, ...l, children: /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        id: a.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": a.open,
        "aria-controls": a.open ? a.contentId : void 0,
        "data-state": a.open ? "open" : "closed",
        "data-disabled": r ? "" : void 0,
        disabled: r,
        ...n,
        ref: Kr(t, a.triggerRef),
        onPointerDown: N(e.onPointerDown, (i) => {
          !r && i.button === 0 && i.ctrlKey === !1 && (a.onOpenToggle(), a.open || i.preventDefault());
        }),
        onKeyDown: N(e.onKeyDown, (i) => {
          r || (["Enter", " "].includes(i.key) && a.onOpenToggle(), i.key === "ArrowDown" && a.onOpenChange(!0), ["Enter", " ", "ArrowDown"].includes(i.key) && i.preventDefault());
        })
      }
    ) });
  }
);
cc.displayName = ic;
var gb = "DropdownMenuPortal", uc = (e) => {
  const { __scopeDropdownMenu: t, ...o } = e, r = se(t);
  return /* @__PURE__ */ c(Ki, { ...r, ...o });
};
uc.displayName = gb;
var dc = "DropdownMenuContent", fc = s.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: o, ...r } = e, n = sc(dc, o), a = se(o), l = s.useRef(!1);
    return /* @__PURE__ */ c(
      ji,
      {
        id: n.contentId,
        "aria-labelledby": n.triggerId,
        ...a,
        ...r,
        ref: t,
        onCloseAutoFocus: N(e.onCloseAutoFocus, (i) => {
          var u;
          l.current || (u = n.triggerRef.current) == null || u.focus(), l.current = !1, i.preventDefault();
        }),
        onInteractOutside: N(e.onInteractOutside, (i) => {
          const u = i.detail.originalEvent, p = u.button === 0 && u.ctrlKey === !0, f = u.button === 2 || p;
          (!n.modal || f) && (l.current = !0);
        }),
        style: {
          ...e.style,
          "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
          "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
          "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }
);
fc.displayName = dc;
var bb = "DropdownMenuGroup", pc = s.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
    return /* @__PURE__ */ c(Yi, { ...n, ...r, ref: t });
  }
);
pc.displayName = bb;
var yb = "DropdownMenuLabel", vc = s.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
    return /* @__PURE__ */ c(Xi, { ...n, ...r, ref: t });
  }
);
vc.displayName = yb;
var wb = "DropdownMenuItem", mc = s.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
    return /* @__PURE__ */ c(qi, { ...n, ...r, ref: t });
  }
);
mc.displayName = wb;
var xb = "DropdownMenuCheckboxItem", hc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(Zi, { ...n, ...r, ref: t });
});
hc.displayName = xb;
var Cb = "DropdownMenuRadioGroup", gc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(Qi, { ...n, ...r, ref: t });
});
gc.displayName = Cb;
var Sb = "DropdownMenuRadioItem", bc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(Ji, { ...n, ...r, ref: t });
});
bc.displayName = Sb;
var Rb = "DropdownMenuItemIndicator", yc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(ec, { ...n, ...r, ref: t });
});
yc.displayName = Rb;
var Nb = "DropdownMenuSeparator", wc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(tc, { ...n, ...r, ref: t });
});
wc.displayName = Nb;
var Eb = "DropdownMenuArrow", Pb = s.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
    return /* @__PURE__ */ c(oc, { ...n, ...r, ref: t });
  }
);
Pb.displayName = Eb;
var Ab = (e) => {
  const { __scopeDropdownMenu: t, children: o, open: r, onOpenChange: n, defaultOpen: a } = e, l = se(t), [i, u] = oe({
    prop: r,
    defaultProp: a ?? !1,
    onChange: n,
    caller: "DropdownMenuSub"
  });
  return /* @__PURE__ */ c(rc, { ...l, open: i, onOpenChange: u, children: o });
}, _b = "DropdownMenuSubTrigger", xc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(nc, { ...n, ...r, ref: t });
});
xc.displayName = _b;
var Tb = "DropdownMenuSubContent", Cc = s.forwardRef((e, t) => {
  const { __scopeDropdownMenu: o, ...r } = e, n = se(o);
  return /* @__PURE__ */ c(
    ac,
    {
      ...n,
      ...r,
      ref: t,
      style: {
        ...e.style,
        "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
        "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
        "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
Cc.displayName = Tb;
var Mb = lc, Ib = cc, Sc = uc, Rc = fc, Db = pc, Nc = vc, Ec = mc, Pc = hc, kb = gc, Ac = bc, _c = yc, Tc = wc, Ob = Ab, Mc = xc, Ic = Cc;
const _0 = Mb, T0 = Ib, M0 = Db, I0 = Sc, D0 = Ob, k0 = kb, Fb = s.forwardRef(({ className: e, inset: t, children: o, ...r }, n) => /* @__PURE__ */ O(
  Mc,
  {
    ref: n,
    className: S(
      "flex cursor-default select-none items-center rounded-lg px-2.5 py-2 text-sm outline-none focus:bg-[color:var(--ds-theme-surface-subdued)] data-[state=open]:bg-[color:var(--ds-theme-surface-subdued)]",
      t && "pl-8",
      e
    ),
    ...r,
    children: [
      o,
      /* @__PURE__ */ c("span", { className: "ml-auto text-xs opacity-60", children: "▶" })
    ]
  }
));
Fb.displayName = Mc.displayName;
const Lb = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Ic,
  {
    ref: o,
    className: S(
      "z-50 min-w-32 overflow-hidden rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-1 text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...t
  }
));
Lb.displayName = Ic.displayName;
const $b = s.forwardRef(({ className: e, sideOffset: t = 4, ...o }, r) => /* @__PURE__ */ c(Sc, { children: /* @__PURE__ */ c(
  Rc,
  {
    ref: r,
    sideOffset: t,
    className: S(
      "z-50 min-w-48 overflow-hidden rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-1 text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...o
  }
) }));
$b.displayName = Rc.displayName;
const zb = s.forwardRef(({ className: e, inset: t, ...o }, r) => /* @__PURE__ */ c(
  Ec,
  {
    ref: r,
    className: S(
      "relative flex cursor-default select-none items-center rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-[color:var(--ds-theme-surface-subdued)] focus:text-[color:var(--ds-theme-content-default)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      t && "pl-8",
      e
    ),
    ...o
  }
));
zb.displayName = Ec.displayName;
const Bb = s.forwardRef(({ className: e, children: t, checked: o, ...r }, n) => /* @__PURE__ */ O(
  Pc,
  {
    ref: n,
    className: S(
      "relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-sm outline-none transition-colors focus:bg-[color:var(--ds-theme-surface-subdued)] focus:text-[color:var(--ds-theme-content-default)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      e
    ),
    checked: o,
    ...r,
    children: [
      /* @__PURE__ */ c("span", { className: "absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ c(_c, { children: "✓" }) }),
      t
    ]
  }
));
Bb.displayName = Pc.displayName;
const Hb = s.forwardRef(({ className: e, children: t, ...o }, r) => /* @__PURE__ */ O(
  Ac,
  {
    ref: r,
    className: S(
      "relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-sm outline-none transition-colors focus:bg-[color:var(--ds-theme-surface-subdued)] focus:text-[color:var(--ds-theme-content-default)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      e
    ),
    ...o,
    children: [
      /* @__PURE__ */ c("span", { className: "absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ c(_c, { children: "●" }) }),
      t
    ]
  }
));
Hb.displayName = Ac.displayName;
const Wb = s.forwardRef(({ className: e, inset: t, ...o }, r) => /* @__PURE__ */ c(
  Nc,
  {
    ref: r,
    className: S(
      "px-2.5 py-1.5 text-sm font-semibold text-[color:var(--ds-theme-content-default)]",
      t && "pl-8",
      e
    ),
    ...o
  }
));
Wb.displayName = Nc.displayName;
const Gb = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Tc,
  {
    ref: o,
    className: S("-mx-1 my-1 h-px bg-[color:var(--ds-theme-border-subtle)]", e),
    ...t
  }
));
Gb.displayName = Tc.displayName;
const Vb = ({ className: e, ...t }) => /* @__PURE__ */ c(
  "span",
  {
    className: S("ml-auto text-xs tracking-widest opacity-60", e),
    ...t
  }
);
Vb.displayName = "DropdownMenuShortcut";
var Ub = [" ", "Enter", "ArrowUp", "ArrowDown"], Kb = [" ", "Enter"], et = "Select", [qo, Zo, jb] = yt(et), [nt] = J(et, [
  jb,
  Me
]), Qo = Me(), [Yb, qe] = nt(et), [Xb, qb] = nt(et), Zb = "SelectProvider";
function Dc(e) {
  const {
    __scopeSelect: t,
    children: o,
    open: r,
    defaultOpen: n,
    onOpenChange: a,
    value: l,
    defaultValue: i,
    onValueChange: u,
    dir: p,
    name: f,
    autoComplete: d,
    disabled: v,
    required: h,
    form: g,
    // @ts-expect-error internal render prop used by `Select` to compose its default parts
    internal_do_not_use_render: m
  } = e, b = Qo(t), [w, y] = s.useState(null), [x, C] = s.useState(null), [R, E] = s.useState(!1), P = Pe(p), [I, _] = oe({
    prop: r,
    defaultProp: n ?? !1,
    onChange: a,
    caller: et
  }), [D, F] = oe({
    prop: l,
    defaultProp: i,
    onChange: u,
    caller: et
  }), T = s.useRef(null), H = w ? !!g || !!w.closest("form") : !0, [B, U] = s.useState(/* @__PURE__ */ new Set()), z = ne(), G = Array.from(B).map((K) => K.props.value).join(";"), k = s.useCallback((K) => {
    U((te) => new Set(te).add(K));
  }, []), A = s.useCallback((K) => {
    U((te) => {
      const fe = new Set(te);
      return fe.delete(K), fe;
    });
  }, []), V = {
    required: h,
    trigger: w,
    onTriggerChange: y,
    valueNode: x,
    onValueNodeChange: C,
    valueNodeHasChildren: R,
    onValueNodeHasChildrenChange: E,
    contentId: z,
    value: D,
    onValueChange: F,
    open: I,
    onOpenChange: _,
    dir: P,
    triggerPointerDownPosRef: T,
    disabled: v,
    name: f,
    autoComplete: d,
    form: g,
    nativeOptions: B,
    nativeSelectKey: G,
    isFormControl: H
  };
  return /* @__PURE__ */ c(St, { ...b, children: /* @__PURE__ */ c(Yb, { scope: t, ...V, children: /* @__PURE__ */ c(qo.Provider, { scope: t, children: /* @__PURE__ */ c(
    Xb,
    {
      scope: t,
      onNativeOptionAdd: k,
      onNativeOptionRemove: A,
      children: dy(m) ? m(V) : o
    }
  ) }) }) });
}
Dc.displayName = Zb;
var kc = (e) => {
  const { __scopeSelect: t, children: o, ...r } = e;
  return /* @__PURE__ */ c(
    Dc,
    {
      __scopeSelect: t,
      ...r,
      internal_do_not_use_render: ({ isFormControl: n }) => /* @__PURE__ */ O(Ee, { children: [
        o,
        n ? /* @__PURE__ */ c(
          ou,
          {
            __scopeSelect: t
          }
        ) : null
      ] })
    }
  );
};
kc.displayName = et;
var Oc = "SelectTrigger", Ln = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, disabled: r = !1, ...n } = e, a = Qo(o), l = qe(Oc, o), i = l.disabled || r, u = L(t, l.onTriggerChange), p = Zo(o), f = s.useRef("touch"), [d, v, h] = ru((m) => {
      const b = p().filter((x) => !x.disabled), w = b.find((x) => x.value === l.value), y = nu(b, m, w);
      y !== void 0 && l.onValueChange(y.value);
    }), g = (m) => {
      i || (l.onOpenChange(!0), h()), m && (l.triggerPointerDownPosRef.current = {
        x: Math.round(m.pageX),
        y: Math.round(m.pageY)
      });
    };
    return /* @__PURE__ */ c(Rt, { asChild: !0, ...a, children: /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        role: "combobox",
        "aria-controls": l.open ? l.contentId : void 0,
        "aria-expanded": l.open,
        "aria-required": l.required,
        "aria-autocomplete": "none",
        dir: l.dir,
        "data-state": l.open ? "open" : "closed",
        disabled: i,
        "data-disabled": i ? "" : void 0,
        "data-placeholder": Jo(l.value) ? "" : void 0,
        ...n,
        ref: u,
        onClick: N(n.onClick, (m) => {
          m.currentTarget.focus(), f.current !== "mouse" && g(m);
        }),
        onPointerDown: N(n.onPointerDown, (m) => {
          f.current = m.pointerType;
          const b = m.target;
          b.hasPointerCapture(m.pointerId) && b.releasePointerCapture(m.pointerId), m.button === 0 && m.ctrlKey === !1 && m.pointerType === "mouse" && (g(m), m.preventDefault());
        }),
        onKeyDown: N(n.onKeyDown, (m) => {
          const b = d.current !== "";
          !(m.ctrlKey || m.altKey || m.metaKey) && m.key.length === 1 && v(m.key), !(b && m.key === " ") && Ub.includes(m.key) && (g(), m.preventDefault());
        })
      }
    ) });
  }
);
Ln.displayName = Oc;
var Fc = "SelectValue", Lc = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, className: r, style: n, children: a, placeholder: l = "", ...i } = e, u = qe(Fc, o), { onValueNodeHasChildrenChange: p } = u, f = a !== void 0, d = L(t, u.onValueNodeChange);
    re(() => {
      p(f);
    }, [p, f]);
    const v = Jo(u.value);
    return /* @__PURE__ */ c(
      M.span,
      {
        ...i,
        asChild: v ? !1 : i.asChild,
        ref: d,
        style: { pointerEvents: "none" },
        children: /* @__PURE__ */ c(s.Fragment, { children: v ? l : a }, v ? "placeholder" : "value")
      }
    );
  }
);
Lc.displayName = Fc;
var Qb = "SelectIcon", $c = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, children: r, ...n } = e;
    return /* @__PURE__ */ c(M.span, { "aria-hidden": !0, ...n, ref: t, children: r || "▼" });
  }
);
$c.displayName = Qb;
var zc = "SelectPortal", [Jb, ey] = nt(zc, {
  forceMount: void 0
}), Bc = (e) => {
  const { __scopeSelect: t, forceMount: o, ...r } = e;
  return /* @__PURE__ */ c(Jb, { scope: e.__scopeSelect, forceMount: o, children: /* @__PURE__ */ c(ot, { asChild: !0, ...r }) });
};
Bc.displayName = zc;
var Ke = "SelectContent", $n = s.forwardRef(
  (e, t) => {
    const o = ey(Ke, e.__scopeSelect), { forceMount: r = o.forceMount, ...n } = e, a = qe(Ke, e.__scopeSelect), [l, i] = s.useState();
    return re(() => {
      i(new DocumentFragment());
    }, []), /* @__PURE__ */ c(ee, { present: r || a.open, children: ({ present: u }) => u ? /* @__PURE__ */ c(Gc, { ...n, ref: t }) : /* @__PURE__ */ c(Hc, { ...n, fragment: l }) });
  }
);
$n.displayName = Ke;
var Hc = s.forwardRef((e, t) => {
  const { __scopeSelect: o, children: r, fragment: n } = e;
  return n ? Ft.createPortal(
    /* @__PURE__ */ c(Wc, { scope: o, children: /* @__PURE__ */ c(qo.Slot, { scope: o, children: /* @__PURE__ */ c("div", { ref: t, children: r }) }) }),
    n
  ) : null;
});
Hc.displayName = "SelectContentFragment";
var he = 10, [Wc, Ze] = nt(Ke), ty = "SelectContentImpl", oy = /* @__PURE__ */ Ge("SelectContent.RemoveScroll"), Gc = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o } = e, {
      position: r = "item-aligned",
      onCloseAutoFocus: n,
      onEscapeKeyDown: a,
      onPointerDownOutside: l,
      //
      // PopperContent props
      side: i,
      sideOffset: u,
      align: p,
      alignOffset: f,
      arrowPadding: d,
      collisionBoundary: v,
      collisionPadding: h,
      sticky: g,
      hideWhenDetached: m,
      avoidCollisions: b,
      //
      ...w
    } = e, y = qe(Ke, o), [x, C] = s.useState(null), [R, E] = s.useState(null), P = L(t, ($) => C($)), [I, _] = s.useState(null), [D, F] = s.useState(
      null
    ), T = Zo(o), [H, B] = s.useState(!1), U = s.useRef(!1);
    s.useEffect(() => {
      if (x) return Go(x);
    }, [x]), $o();
    const z = s.useCallback(
      ($) => {
        const [X, ...Z] = T().map((q) => q.ref.current), [Y] = Z.slice(-1), j = document.activeElement;
        for (const q of $)
          if (q === j || (q == null || q.scrollIntoView({ block: "nearest" }), q === X && R && (R.scrollTop = 0), q === Y && R && (R.scrollTop = R.scrollHeight), q == null || q.focus(), document.activeElement !== j)) return;
      },
      [T, R]
    ), G = s.useCallback(
      () => z([I, x]),
      [z, I, x]
    );
    s.useEffect(() => {
      H && G();
    }, [H, G]);
    const { onOpenChange: k, triggerPointerDownPosRef: A } = y;
    s.useEffect(() => {
      if (x) {
        let $ = { x: 0, y: 0 };
        const X = (Y) => {
          var j, q;
          $ = {
            x: Math.abs(Math.round(Y.pageX) - (((j = A.current) == null ? void 0 : j.x) ?? 0)),
            y: Math.abs(Math.round(Y.pageY) - (((q = A.current) == null ? void 0 : q.y) ?? 0))
          };
        }, Z = (Y) => {
          $.x <= 10 && $.y <= 10 ? Y.preventDefault() : Y.composedPath().includes(x) || k(!1), document.removeEventListener("pointermove", X), A.current = null;
        };
        return A.current !== null && (document.addEventListener("pointermove", X), document.addEventListener("pointerup", Z, { capture: !0, once: !0 })), () => {
          document.removeEventListener("pointermove", X), document.removeEventListener("pointerup", Z, { capture: !0 });
        };
      }
    }, [x, k, A]), s.useEffect(() => {
      const $ = () => k(!1);
      return window.addEventListener("blur", $), window.addEventListener("resize", $), () => {
        window.removeEventListener("blur", $), window.removeEventListener("resize", $);
      };
    }, [k]);
    const [V, K] = ru(($) => {
      const X = T().filter((j) => !j.disabled), Z = X.find((j) => j.ref.current === document.activeElement), Y = nu(X, $, Z);
      Y && setTimeout(() => {
        var j;
        return (j = Y.ref.current) == null ? void 0 : j.focus();
      });
    }), te = s.useCallback(
      ($, X, Z) => {
        const Y = !U.current && !Z;
        (y.value !== void 0 && y.value === X || Y) && (_($), Y && (U.current = !0));
      },
      [y.value]
    ), fe = s.useCallback(() => x == null ? void 0 : x.focus(), [x]), pe = s.useCallback(
      ($, X, Z) => {
        const Y = !U.current && !Z;
        (y.value !== void 0 && y.value === X || Y) && F($);
      },
      [y.value]
    ), Ie = r === "popper" ? Lr : Vc, ie = Ie === Lr ? {
      side: i,
      sideOffset: u,
      align: p,
      alignOffset: f,
      arrowPadding: d,
      collisionBoundary: v,
      collisionPadding: h,
      sticky: g,
      hideWhenDetached: m,
      avoidCollisions: b
    } : {};
    return /* @__PURE__ */ c(
      Wc,
      {
        scope: o,
        content: x,
        viewport: R,
        onViewportChange: E,
        itemRefCallback: te,
        selectedItem: I,
        onItemLeave: fe,
        itemTextRefCallback: pe,
        focusSelectedItem: G,
        selectedItemText: D,
        position: r,
        isPositioned: H,
        searchRef: V,
        children: /* @__PURE__ */ c(Ut, { as: oy, allowPinchZoom: !0, children: /* @__PURE__ */ c(
          Ht,
          {
            asChild: !0,
            trapped: y.open,
            onMountAutoFocus: ($) => {
              $.preventDefault();
            },
            onUnmountAutoFocus: N(n, ($) => {
              var X;
              (X = y.trigger) == null || X.focus({ preventScroll: !0 }), $.preventDefault();
            }),
            children: /* @__PURE__ */ c(
              tt,
              {
                asChild: !0,
                disableOutsidePointerEvents: !0,
                onEscapeKeyDown: a,
                onPointerDownOutside: l,
                onFocusOutside: ($) => $.preventDefault(),
                onDismiss: () => y.onOpenChange(!1),
                children: /* @__PURE__ */ c(
                  Ie,
                  {
                    role: "listbox",
                    id: y.contentId,
                    "data-state": y.open ? "open" : "closed",
                    dir: y.dir,
                    onContextMenu: ($) => $.preventDefault(),
                    ...w,
                    ...ie,
                    onPlaced: () => B(!0),
                    ref: P,
                    style: {
                      // flex layout so we can place the scroll buttons properly
                      display: "flex",
                      flexDirection: "column",
                      // reset the outline by default as the content MAY get focused
                      outline: "none",
                      ...w.style
                    },
                    onKeyDown: N(w.onKeyDown, ($) => {
                      const X = $.ctrlKey || $.altKey || $.metaKey;
                      if ($.key === "Tab" && $.preventDefault(), !X && $.key.length === 1 && K($.key), ["ArrowUp", "ArrowDown", "Home", "End"].includes($.key)) {
                        let Y = T().filter((j) => !j.disabled).map((j) => j.ref.current);
                        if (["ArrowUp", "End"].includes($.key) && (Y = Y.slice().reverse()), ["ArrowUp", "ArrowDown"].includes($.key)) {
                          const j = $.target, q = Y.indexOf(j);
                          Y = Y.slice(q + 1);
                        }
                        setTimeout(() => z(Y)), $.preventDefault();
                      }
                    })
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
Gc.displayName = ty;
var ry = "SelectItemAlignedPosition", Vc = s.forwardRef((e, t) => {
  const { __scopeSelect: o, onPlaced: r, ...n } = e, a = qe(Ke, o), l = Ze(Ke, o), [i, u] = s.useState(null), [p, f] = s.useState(null), d = L(t, (P) => f(P)), v = Zo(o), h = s.useRef(!1), g = s.useRef(!0), { viewport: m, selectedItem: b, selectedItemText: w, focusSelectedItem: y } = l, x = s.useCallback(() => {
    if (a.trigger && a.valueNode && i && p && m && b && w) {
      const P = a.trigger.getBoundingClientRect(), I = p.getBoundingClientRect(), _ = a.valueNode.getBoundingClientRect(), D = w.getBoundingClientRect();
      if (a.dir !== "rtl") {
        const j = D.left - I.left, q = _.left - j, xe = P.left - q, ce = P.width + xe, at = Math.max(ce, I.width), Nt = window.innerWidth - he, Et = Mt(q, [
          he,
          // Prevents the content from going off the starting edge of the
          // viewport. It may still go off the ending edge, but this can be
          // controlled by the user since they may want to manage overflow in a
          // specific way.
          // https://github.com/radix-ui/primitives/issues/2049
          Math.max(he, Nt - at)
        ]);
        i.style.minWidth = ce + "px", i.style.left = Et + "px";
      } else {
        const j = I.right - D.right, q = window.innerWidth - _.right - j, xe = window.innerWidth - P.right - q, ce = P.width + xe, at = Math.max(ce, I.width), Nt = window.innerWidth - he, Et = Mt(q, [
          he,
          Math.max(he, Nt - at)
        ]);
        i.style.minWidth = ce + "px", i.style.right = Et + "px";
      }
      const F = v(), T = window.innerHeight - he * 2, H = m.scrollHeight, B = window.getComputedStyle(p), U = parseInt(B.borderTopWidth, 10), z = parseInt(B.paddingTop, 10), G = parseInt(B.borderBottomWidth, 10), k = parseInt(B.paddingBottom, 10), A = U + z + H + k + G, V = Math.min(b.offsetHeight * 5, A), K = window.getComputedStyle(m), te = parseInt(K.paddingTop, 10), fe = parseInt(K.paddingBottom, 10), pe = P.top + P.height / 2 - he, Ie = T - pe, ie = b.offsetHeight / 2, $ = b.offsetTop + ie, X = U + z + $, Z = A - X;
      if (X <= pe) {
        const j = F.length > 0 && b === F[F.length - 1].ref.current;
        i.style.bottom = "0px";
        const q = p.clientHeight - m.offsetTop - m.offsetHeight, xe = Math.max(
          Ie,
          ie + // viewport might have padding bottom, include it to avoid a scrollable viewport
          (j ? fe : 0) + q + G
        ), ce = X + xe;
        i.style.height = ce + "px";
      } else {
        const j = F.length > 0 && b === F[0].ref.current;
        i.style.top = "0px";
        const xe = Math.max(
          pe,
          U + m.offsetTop + // viewport might have padding top, include it to avoid a scrollable viewport
          (j ? te : 0) + ie
        ) + Z;
        i.style.height = xe + "px", m.scrollTop = X - pe + m.offsetTop;
      }
      i.style.margin = `${he}px 0`, i.style.minHeight = V + "px", i.style.maxHeight = T + "px", r == null || r(), requestAnimationFrame(() => h.current = !0);
    }
  }, [
    v,
    a.trigger,
    a.valueNode,
    i,
    p,
    m,
    b,
    w,
    a.dir,
    r
  ]);
  re(() => x(), [x]);
  const [C, R] = s.useState();
  re(() => {
    p && R(window.getComputedStyle(p).zIndex);
  }, [p]);
  const E = s.useCallback(
    (P) => {
      P && g.current === !0 && (x(), y == null || y(), g.current = !1);
    },
    [x, y]
  );
  return /* @__PURE__ */ c(
    ay,
    {
      scope: o,
      contentWrapper: i,
      shouldExpandOnScrollRef: h,
      onScrollButtonChange: E,
      children: /* @__PURE__ */ c(
        "div",
        {
          ref: u,
          style: {
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            zIndex: C
          },
          children: /* @__PURE__ */ c(
            M.div,
            {
              ...n,
              ref: d,
              style: {
                // When we get the height of the content, it includes borders. If we were to set
                // the height without having `boxSizing: 'border-box'` it would be too big.
                boxSizing: "border-box",
                // We need to ensure the content doesn't get taller than the wrapper
                maxHeight: "100%",
                ...n.style
              }
            }
          )
        }
      )
    }
  );
});
Vc.displayName = ry;
var ny = "SelectPopperPosition", Lr = s.forwardRef((e, t) => {
  const {
    __scopeSelect: o,
    align: r = "start",
    collisionPadding: n = he,
    ...a
  } = e, l = Qo(o);
  return /* @__PURE__ */ c(
    Gt,
    {
      ...l,
      ...a,
      ref: t,
      align: r,
      collisionPadding: n,
      style: {
        // Ensure border-box for floating-ui calculations
        boxSizing: "border-box",
        ...a.style,
        "--radix-select-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-select-content-available-width": "var(--radix-popper-available-width)",
        "--radix-select-content-available-height": "var(--radix-popper-available-height)",
        "--radix-select-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-select-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
Lr.displayName = ny;
var [ay, zn] = nt(Ke, {}), $r = "SelectViewport", Uc = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, nonce: r, ...n } = e, a = Ze($r, o), l = zn($r, o), i = L(t, a.onViewportChange), u = s.useRef(0);
    return /* @__PURE__ */ O(Ee, { children: [
      /* @__PURE__ */ c(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: "[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}"
          },
          nonce: r
        }
      ),
      /* @__PURE__ */ c(qo.Slot, { scope: o, children: /* @__PURE__ */ c(
        M.div,
        {
          "data-radix-select-viewport": "",
          role: "presentation",
          ...n,
          ref: i,
          style: {
            // we use position: 'relative' here on the `viewport` so that when we call
            // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
            // (independent of the scrollUpButton).
            position: "relative",
            flex: 1,
            // Viewport should only be scrollable in the vertical direction.
            // This won't work in vertical writing modes, so we'll need to
            // revisit this if/when that is supported
            // https://developer.chrome.com/blog/vertical-form-controls
            overflow: "hidden auto",
            ...n.style
          },
          onScroll: N(n.onScroll, (p) => {
            const f = p.currentTarget, { contentWrapper: d, shouldExpandOnScrollRef: v } = l;
            if (v != null && v.current && d) {
              const h = Math.abs(u.current - f.scrollTop);
              if (h > 0) {
                const g = window.innerHeight - he * 2, m = parseFloat(d.style.minHeight), b = parseFloat(d.style.height), w = Math.max(m, b);
                if (w < g) {
                  const y = w + h, x = Math.min(g, y), C = y - x;
                  d.style.height = x + "px", d.style.bottom === "0px" && (f.scrollTop = C > 0 ? C : 0, d.style.justifyContent = "flex-end");
                }
              }
            }
            u.current = f.scrollTop;
          })
        }
      ) })
    ] });
  }
);
Uc.displayName = $r;
var Kc = "SelectGroup", [sy, ly] = nt(Kc), jc = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, ...r } = e, n = ne();
    return /* @__PURE__ */ c(sy, { scope: o, id: n, children: /* @__PURE__ */ c(M.div, { role: "group", "aria-labelledby": n, ...r, ref: t }) });
  }
);
jc.displayName = Kc;
var Yc = "SelectLabel", Bn = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, ...r } = e, n = ly(Yc, o);
    return /* @__PURE__ */ c(M.div, { id: n.id, ...r, ref: t });
  }
);
Bn.displayName = Yc;
var Co = "SelectItem", [iy, Xc] = nt(Co), Hn = s.forwardRef(
  (e, t) => {
    const {
      __scopeSelect: o,
      value: r,
      disabled: n = !1,
      textValue: a,
      ...l
    } = e, i = qe(Co, o), u = Ze(Co, o), p = i.value === r, [f, d] = s.useState(a ?? ""), [v, h] = s.useState(!1), g = L(
      t,
      (y) => {
        var x;
        return (x = u.itemRefCallback) == null ? void 0 : x.call(u, y, r, n);
      }
    ), m = ne(), b = s.useRef("touch"), w = () => {
      n || (i.onValueChange(r), i.onOpenChange(!1));
    };
    return /* @__PURE__ */ c(
      iy,
      {
        scope: o,
        value: r,
        disabled: n,
        textId: m,
        isSelected: p,
        onItemTextChange: s.useCallback((y) => {
          d((x) => x || ((y == null ? void 0 : y.textContent) ?? "").trim());
        }, []),
        children: /* @__PURE__ */ c(
          qo.ItemSlot,
          {
            scope: o,
            value: r,
            disabled: n,
            textValue: f,
            children: /* @__PURE__ */ c(
              M.div,
              {
                role: "option",
                "aria-labelledby": m,
                "data-highlighted": v ? "" : void 0,
                "aria-selected": p && v,
                "data-state": p ? "checked" : "unchecked",
                "aria-disabled": n || void 0,
                "data-disabled": n ? "" : void 0,
                tabIndex: n ? void 0 : -1,
                ...l,
                ref: g,
                onFocus: N(l.onFocus, () => h(!0)),
                onBlur: N(l.onBlur, () => h(!1)),
                onClick: N(l.onClick, () => {
                  b.current !== "mouse" && w();
                }),
                onPointerUp: N(l.onPointerUp, () => {
                  b.current === "mouse" && w();
                }),
                onPointerDown: N(l.onPointerDown, (y) => {
                  b.current = y.pointerType;
                }),
                onPointerMove: N(l.onPointerMove, (y) => {
                  var x;
                  b.current = y.pointerType, n ? (x = u.onItemLeave) == null || x.call(u) : b.current === "mouse" && y.currentTarget.focus({ preventScroll: !0 });
                }),
                onPointerLeave: N(l.onPointerLeave, (y) => {
                  var x;
                  y.currentTarget === document.activeElement && ((x = u.onItemLeave) == null || x.call(u));
                }),
                onKeyDown: N(l.onKeyDown, (y) => {
                  var C;
                  ((C = u.searchRef) == null ? void 0 : C.current) !== "" && y.key === " " || (Kb.includes(y.key) && w(), y.key === " " && y.preventDefault());
                })
              }
            )
          }
        )
      }
    );
  }
);
Hn.displayName = Co;
var Tt = "SelectItemText", qc = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, className: r, style: n, ...a } = e, l = qe(Tt, o), i = Ze(Tt, o), u = Xc(Tt, o), p = qb(Tt, o), [f, d] = s.useState(null), v = L(
      t,
      (w) => d(w),
      u.onItemTextChange,
      (w) => {
        var y;
        return (y = i.itemTextRefCallback) == null ? void 0 : y.call(i, w, u.value, u.disabled);
      }
    ), h = f == null ? void 0 : f.textContent, g = s.useMemo(
      () => /* @__PURE__ */ c("option", { value: u.value, disabled: u.disabled, children: h }, u.value),
      [u.disabled, u.value, h]
    ), { onNativeOptionAdd: m, onNativeOptionRemove: b } = p;
    return re(() => (m(g), () => b(g)), [m, b, g]), /* @__PURE__ */ O(Ee, { children: [
      /* @__PURE__ */ c(M.span, { id: u.textId, ...a, ref: v }),
      u.isSelected && l.valueNode && !l.valueNodeHasChildren && !Jo(l.value) ? Ft.createPortal(a.children, l.valueNode) : null
    ] });
  }
);
qc.displayName = Tt;
var Zc = "SelectItemIndicator", Qc = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, ...r } = e;
    return Xc(Zc, o).isSelected ? /* @__PURE__ */ c(M.span, { "aria-hidden": !0, ...r, ref: t }) : null;
  }
);
Qc.displayName = Zc;
var zr = "SelectScrollUpButton", Wn = s.forwardRef((e, t) => {
  const o = Ze(zr, e.__scopeSelect), r = zn(zr, e.__scopeSelect), [n, a] = s.useState(!1), l = L(t, r.onScrollButtonChange);
  return re(() => {
    if (o.viewport && o.isPositioned) {
      let i = function() {
        const p = u.scrollTop > 0;
        a(p);
      };
      const u = o.viewport;
      return i(), u.addEventListener("scroll", i), () => u.removeEventListener("scroll", i);
    }
  }, [o.viewport, o.isPositioned]), n ? /* @__PURE__ */ c(
    Jc,
    {
      ...e,
      ref: l,
      onAutoScroll: () => {
        const { viewport: i, selectedItem: u } = o;
        i && u && (i.scrollTop = i.scrollTop - u.offsetHeight);
      }
    }
  ) : null;
});
Wn.displayName = zr;
var Br = "SelectScrollDownButton", Gn = s.forwardRef((e, t) => {
  const o = Ze(Br, e.__scopeSelect), r = zn(Br, e.__scopeSelect), [n, a] = s.useState(!1), l = L(t, r.onScrollButtonChange);
  return re(() => {
    if (o.viewport && o.isPositioned) {
      let i = function() {
        const p = u.scrollHeight - u.clientHeight, f = Math.ceil(u.scrollTop) < p;
        a(f);
      };
      const u = o.viewport;
      return i(), u.addEventListener("scroll", i), () => u.removeEventListener("scroll", i);
    }
  }, [o.viewport, o.isPositioned]), n ? /* @__PURE__ */ c(
    Jc,
    {
      ...e,
      ref: l,
      onAutoScroll: () => {
        const { viewport: i, selectedItem: u } = o;
        i && u && (i.scrollTop = i.scrollTop + u.offsetHeight);
      }
    }
  ) : null;
});
Gn.displayName = Br;
var Jc = s.forwardRef((e, t) => {
  const { __scopeSelect: o, onAutoScroll: r, ...n } = e, a = Ze("SelectScrollButton", o), l = s.useRef(null), i = Zo(o), u = s.useCallback(() => {
    l.current !== null && (window.clearInterval(l.current), l.current = null);
  }, []);
  return s.useEffect(() => () => u(), [u]), re(() => {
    var f;
    const p = i().find((d) => d.ref.current === document.activeElement);
    (f = p == null ? void 0 : p.ref.current) == null || f.scrollIntoView({ block: "nearest" });
  }, [i]), /* @__PURE__ */ c(
    M.div,
    {
      "aria-hidden": !0,
      ...n,
      ref: t,
      style: { flexShrink: 0, ...n.style },
      onPointerDown: N(n.onPointerDown, () => {
        l.current === null && (l.current = window.setInterval(r, 50));
      }),
      onPointerMove: N(n.onPointerMove, () => {
        var p;
        (p = a.onItemLeave) == null || p.call(a), l.current === null && (l.current = window.setInterval(r, 50));
      }),
      onPointerLeave: N(n.onPointerLeave, () => {
        u();
      })
    }
  );
}), cy = "SelectSeparator", Vn = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, ...r } = e;
    return /* @__PURE__ */ c(M.div, { "aria-hidden": !0, ...r, ref: t });
  }
);
Vn.displayName = cy;
var eu = "SelectArrow", uy = s.forwardRef(
  (e, t) => {
    const { __scopeSelect: o, ...r } = e, n = Qo(o);
    return Ze(eu, o).position === "popper" ? /* @__PURE__ */ c(Vt, { ...n, ...r, ref: t }) : null;
  }
);
uy.displayName = eu;
var tu = "SelectBubbleInput", ou = s.forwardRef(
  ({ __scopeSelect: e, ...t }, o) => {
    const r = qe(tu, e), { value: n, onValueChange: a, required: l, disabled: i, name: u, autoComplete: p, form: f } = r, { nativeOptions: d, nativeSelectKey: v } = r, h = s.useRef(null), g = L(o, h), m = n ?? "", b = Ao(m), w = Array.from(d).some(
      (y) => (y.props.value ?? "") === ""
    );
    return s.useEffect(() => {
      const y = h.current;
      if (!y) return;
      const x = window.HTMLSelectElement.prototype, R = Object.getOwnPropertyDescriptor(
        x,
        "value"
      ).set;
      if (b !== m && R) {
        const E = new Event("change", { bubbles: !0 });
        R.call(y, m), y.dispatchEvent(E);
      }
    }, [b, m]), /* @__PURE__ */ O(
      M.select,
      {
        "aria-hidden": !0,
        required: l,
        tabIndex: -1,
        name: u,
        autoComplete: p,
        disabled: i,
        form: f,
        onChange: (y) => a(y.target.value),
        ...t,
        style: { ...ci, ...t.style },
        ref: g,
        defaultValue: m,
        children: [
          Jo(n) && !w ? /* @__PURE__ */ c("option", { value: "" }) : null,
          Array.from(d)
        ]
      },
      v
    );
  }
);
ou.displayName = tu;
function dy(e) {
  return typeof e == "function";
}
function Jo(e) {
  return e === "" || e === void 0;
}
function ru(e) {
  const t = ae(e), o = s.useRef(""), r = s.useRef(0), n = s.useCallback(
    (l) => {
      const i = o.current + l;
      t(i), (function u(p) {
        o.current = p, window.clearTimeout(r.current), p !== "" && (r.current = window.setTimeout(() => u(""), 1e3));
      })(i);
    },
    [t]
  ), a = s.useCallback(() => {
    o.current = "", window.clearTimeout(r.current);
  }, []);
  return s.useEffect(() => () => window.clearTimeout(r.current), []), [o, n, a];
}
function nu(e, t, o) {
  const n = t.length > 1 && Array.from(t).every((p) => p === t[0]) ? t[0] : t, a = o ? e.indexOf(o) : -1;
  let l = fy(e, Math.max(a, 0));
  n.length === 1 && (l = l.filter((p) => p !== o));
  const u = l.find(
    (p) => p.textValue.toLowerCase().startsWith(n.toLowerCase())
  );
  return u !== o ? u : void 0;
}
function fy(e, t) {
  return e.map((o, r) => e[(t + r) % e.length]);
}
const O0 = kc, F0 = jc, L0 = Lc, py = s.forwardRef(({ className: e, children: t, ...o }, r) => /* @__PURE__ */ O(
  Ln,
  {
    ref: r,
    className: S(
      "flex h-10 w-full items-center justify-between rounded-lg border border-[color:var(--ds-theme-border-default)] bg-[color:var(--ds-theme-surface-default)] px-3 py-2 text-sm text-[color:var(--ds-theme-content-default)] placeholder:text-[color:var(--ds-theme-content-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      e
    ),
    ...o,
    children: [
      t,
      /* @__PURE__ */ c($c, { asChild: !0, children: /* @__PURE__ */ c("span", { className: "text-xs opacity-50", children: "▼" }) })
    ]
  }
));
py.displayName = Ln.displayName;
const au = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Wn,
  {
    ref: o,
    className: S("flex cursor-default items-center justify-center py-1", e),
    ...t,
    children: "▲"
  }
));
au.displayName = Wn.displayName;
const su = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Gn,
  {
    ref: o,
    className: S("flex cursor-default items-center justify-center py-1", e),
    ...t,
    children: "▼"
  }
));
su.displayName = Gn.displayName;
const vy = s.forwardRef(({ className: e, children: t, position: o = "popper", ...r }, n) => /* @__PURE__ */ c(Bc, { children: /* @__PURE__ */ O(
  $n,
  {
    ref: n,
    className: S(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      o === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      e
    ),
    position: o,
    ...r,
    children: [
      /* @__PURE__ */ c(au, {}),
      /* @__PURE__ */ c(
        Uc,
        {
          className: S(
            "p-1",
            o === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children: t
        }
      ),
      /* @__PURE__ */ c(su, {})
    ]
  }
) }));
vy.displayName = $n.displayName;
const my = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Bn,
  {
    ref: o,
    className: S("py-1.5 pl-8 pr-2 text-sm font-semibold text-[color:var(--ds-theme-content-default)]", e),
    ...t
  }
));
my.displayName = Bn.displayName;
const hy = s.forwardRef(({ className: e, children: t, ...o }, r) => /* @__PURE__ */ O(
  Hn,
  {
    ref: r,
    className: S(
      "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-sm outline-none focus:bg-[color:var(--ds-theme-surface-subdued)] focus:text-[color:var(--ds-theme-content-default)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      e
    ),
    ...o,
    children: [
      /* @__PURE__ */ c("span", { className: "absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ c(Qc, { children: "✓" }) }),
      /* @__PURE__ */ c(qc, { children: t })
    ]
  }
));
hy.displayName = Hn.displayName;
const gy = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Vn,
  {
    ref: o,
    className: S("-mx-1 my-1 h-px bg-[color:var(--ds-theme-border-subtle)]", e),
    ...t
  }
));
gy.displayName = Vn.displayName;
var Rr, er = "HoverCard", [lu] = J(er, [
  Me
]), tr = Me(), [by, or] = lu(er), iu = (e) => {
  const {
    __scopeHoverCard: t,
    children: o,
    open: r,
    defaultOpen: n,
    onOpenChange: a,
    openDelay: l = 700,
    closeDelay: i = 300
  } = e, u = tr(t), p = s.useRef(0), f = s.useRef(0), d = s.useRef(!1), v = s.useRef(!1), [h, g] = oe({
    prop: r,
    defaultProp: n ?? !1,
    onChange: a,
    caller: er
  }), m = s.useCallback(() => {
    clearTimeout(f.current), p.current = window.setTimeout(() => g(!0), l);
  }, [l, g]), b = s.useCallback(() => {
    clearTimeout(p.current), !d.current && !v.current && (f.current = window.setTimeout(() => g(!1), i));
  }, [i, g]), w = s.useCallback(() => g(!1), [g]);
  return s.useEffect(() => () => {
    clearTimeout(p.current), clearTimeout(f.current);
  }, []), /* @__PURE__ */ c(
    by,
    {
      scope: t,
      open: h,
      onOpenChange: g,
      onOpen: m,
      onClose: b,
      onDismiss: w,
      hasSelectionRef: d,
      isPointerDownOnContentRef: v,
      children: /* @__PURE__ */ c(St, { ...u, children: o })
    }
  );
};
iu.displayName = er;
var cu = "HoverCardTrigger", uu = s.forwardRef(
  (e, t) => {
    const { __scopeHoverCard: o, ...r } = e, n = or(cu, o), a = tr(o);
    return /* @__PURE__ */ c(Rt, { asChild: !0, ...a, children: /* @__PURE__ */ c(
      M.a,
      {
        "data-state": n.open ? "open" : "closed",
        ...r,
        ref: t,
        onPointerEnter: N(e.onPointerEnter, Ro(n.onOpen)),
        onPointerLeave: N(e.onPointerLeave, Ro(n.onClose)),
        onFocus: N(e.onFocus, n.onOpen),
        onBlur: N(e.onBlur, n.onClose),
        onTouchStart: N(e.onTouchStart, (l) => l.preventDefault())
      }
    ) });
  }
);
uu.displayName = cu;
var Un = "HoverCardPortal", [yy, wy] = lu(Un, {
  forceMount: void 0
}), du = (e) => {
  const { __scopeHoverCard: t, forceMount: o, children: r, container: n } = e, a = or(Un, t);
  return /* @__PURE__ */ c(yy, { scope: t, forceMount: o, children: /* @__PURE__ */ c(ee, { present: o || a.open, children: /* @__PURE__ */ c(ot, { asChild: !0, container: n, children: r }) }) });
};
du.displayName = Un;
var So = "HoverCardContent", fu = s.forwardRef(
  (e, t) => {
    const o = wy(So, e.__scopeHoverCard), { forceMount: r = o.forceMount, ...n } = e, a = or(So, e.__scopeHoverCard);
    return /* @__PURE__ */ c(ee, { present: r || a.open, children: /* @__PURE__ */ c(
      xy,
      {
        "data-state": a.open ? "open" : "closed",
        ...n,
        onPointerEnter: N(e.onPointerEnter, Ro(a.onOpen)),
        onPointerLeave: N(e.onPointerLeave, Ro(a.onClose)),
        ref: t
      }
    ) });
  }
);
fu.displayName = So;
var xy = s.forwardRef((e, t) => {
  const {
    __scopeHoverCard: o,
    onEscapeKeyDown: r,
    onPointerDownOutside: n,
    onFocusOutside: a,
    onInteractOutside: l,
    ...i
  } = e, u = or(So, o), p = tr(o), f = s.useRef(null), d = L(t, f), [v, h] = s.useState(!1);
  return s.useEffect(() => {
    if (v) {
      const g = document.body;
      return Rr = g.style.userSelect || g.style.webkitUserSelect, g.style.userSelect = "none", g.style.webkitUserSelect = "none", () => {
        g.style.userSelect = Rr, g.style.webkitUserSelect = Rr;
      };
    }
  }, [v]), s.useEffect(() => {
    if (f.current) {
      const g = () => {
        h(!1), u.isPointerDownOnContentRef.current = !1, setTimeout(() => {
          var b;
          ((b = document.getSelection()) == null ? void 0 : b.toString()) !== "" && (u.hasSelectionRef.current = !0);
        });
      };
      return document.addEventListener("pointerup", g), () => {
        document.removeEventListener("pointerup", g), u.hasSelectionRef.current = !1, u.isPointerDownOnContentRef.current = !1;
      };
    }
  }, [u.isPointerDownOnContentRef, u.hasSelectionRef]), s.useEffect(() => {
    f.current && Ry(f.current).forEach((m) => m.setAttribute("tabindex", "-1"));
  }), /* @__PURE__ */ c(
    tt,
    {
      asChild: !0,
      disableOutsidePointerEvents: !1,
      onInteractOutside: l,
      onEscapeKeyDown: r,
      onPointerDownOutside: n,
      onFocusOutside: N(a, (g) => {
        g.preventDefault();
      }),
      onDismiss: u.onDismiss,
      children: /* @__PURE__ */ c(
        Gt,
        {
          ...p,
          ...i,
          onPointerDown: N(i.onPointerDown, (g) => {
            g.currentTarget.contains(g.target) && h(!0), u.hasSelectionRef.current = !1, u.isPointerDownOnContentRef.current = !0;
          }),
          ref: d,
          style: {
            ...i.style,
            userSelect: v ? "text" : void 0,
            // Safari requires prefix
            WebkitUserSelect: v ? "text" : void 0,
            "--radix-hover-card-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-hover-card-content-available-width": "var(--radix-popper-available-width)",
            "--radix-hover-card-content-available-height": "var(--radix-popper-available-height)",
            "--radix-hover-card-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-hover-card-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      )
    }
  );
}), Cy = "HoverCardArrow", Sy = s.forwardRef(
  (e, t) => {
    const { __scopeHoverCard: o, ...r } = e, n = tr(o);
    return /* @__PURE__ */ c(Vt, { ...n, ...r, ref: t });
  }
);
Sy.displayName = Cy;
function Ro(e) {
  return (t) => t.pointerType === "touch" ? void 0 : e();
}
function Ry(e) {
  const t = [], o = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  });
  for (; o.nextNode(); ) t.push(o.currentNode);
  return t;
}
var Ny = iu, Ey = uu, Py = du, pu = fu;
const $0 = Ny, z0 = Ey, Ay = s.forwardRef(({ className: e, align: t = "center", sideOffset: o = 4, ...r }, n) => /* @__PURE__ */ c(Py, { children: /* @__PURE__ */ c(
  pu,
  {
    ref: n,
    align: t,
    sideOffset: o,
    className: S(
      "z-50 w-80 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-4 text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...r
  }
) }));
Ay.displayName = pu.displayName;
var rr = "Dialog", [vu, mu] = J(rr), [_y, ye] = vu(rr), Kn = (e) => {
  const {
    __scopeDialog: t,
    children: o,
    open: r,
    defaultOpen: n,
    onOpenChange: a,
    modal: l = !0
  } = e, i = s.useRef(null), u = s.useRef(null), [p, f] = oe({
    prop: r,
    defaultProp: n ?? !1,
    onChange: a,
    caller: rr
  });
  return /* @__PURE__ */ c(
    _y,
    {
      scope: t,
      triggerRef: i,
      contentRef: u,
      contentId: ne(),
      titleId: ne(),
      descriptionId: ne(),
      open: p,
      onOpenChange: f,
      onOpenToggle: s.useCallback(() => f((d) => !d), [f]),
      modal: l,
      children: o
    }
  );
};
Kn.displayName = rr;
var hu = "DialogTrigger", jn = s.forwardRef(
  (e, t) => {
    const { __scopeDialog: o, ...r } = e, n = ye(hu, o), a = L(t, n.triggerRef);
    return /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": n.open,
        "aria-controls": n.open ? n.contentId : void 0,
        "data-state": qn(n.open),
        ...r,
        ref: a,
        onClick: N(e.onClick, n.onOpenToggle)
      }
    );
  }
);
jn.displayName = hu;
var Yn = "DialogPortal", [Ty, gu] = vu(Yn, {
  forceMount: void 0
}), Xn = (e) => {
  const { __scopeDialog: t, forceMount: o, children: r, container: n } = e, a = ye(Yn, t);
  return /* @__PURE__ */ c(Ty, { scope: t, forceMount: o, children: s.Children.map(r, (l) => /* @__PURE__ */ c(ee, { present: o || a.open, children: /* @__PURE__ */ c(ot, { asChild: !0, container: n, children: l }) })) });
};
Xn.displayName = Yn;
var No = "DialogOverlay", nr = s.forwardRef(
  (e, t) => {
    const o = gu(No, e.__scopeDialog), { forceMount: r = o.forceMount, ...n } = e, a = ye(No, e.__scopeDialog);
    return a.modal ? /* @__PURE__ */ c(ee, { present: r || a.open, children: /* @__PURE__ */ c(Iy, { ...n, ref: t }) }) : null;
  }
);
nr.displayName = No;
var My = /* @__PURE__ */ Ge("DialogOverlay.RemoveScroll"), Iy = s.forwardRef(
  (e, t) => {
    const { __scopeDialog: o, ...r } = e, n = ye(No, o), a = qv(), l = L(t, a);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ c(Ut, { as: My, allowPinchZoom: !0, shards: [n.contentRef], children: /* @__PURE__ */ c(
        M.div,
        {
          "data-state": qn(n.open),
          ...r,
          ref: l,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), gt = "DialogContent", ar = s.forwardRef(
  (e, t) => {
    const o = gu(gt, e.__scopeDialog), { forceMount: r = o.forceMount, ...n } = e, a = ye(gt, e.__scopeDialog);
    return /* @__PURE__ */ c(ee, { present: r || a.open, children: a.modal ? /* @__PURE__ */ c(Dy, { ...n, ref: t }) : /* @__PURE__ */ c(ky, { ...n, ref: t }) });
  }
);
ar.displayName = gt;
var Dy = s.forwardRef(
  (e, t) => {
    const o = ye(gt, e.__scopeDialog), r = s.useRef(null), n = L(t, o.contentRef, r);
    return s.useEffect(() => {
      const a = r.current;
      if (a) return Go(a);
    }, []), /* @__PURE__ */ c(
      bu,
      {
        ...e,
        ref: n,
        trapFocus: o.open,
        disableOutsidePointerEvents: o.open,
        onCloseAutoFocus: N(e.onCloseAutoFocus, (a) => {
          var l;
          a.preventDefault(), (l = o.triggerRef.current) == null || l.focus();
        }),
        onPointerDownOutside: N(e.onPointerDownOutside, (a) => {
          const l = a.detail.originalEvent, i = l.button === 0 && l.ctrlKey === !0;
          (l.button === 2 || i) && a.preventDefault();
        }),
        onFocusOutside: N(
          e.onFocusOutside,
          (a) => a.preventDefault()
        )
      }
    );
  }
), ky = s.forwardRef(
  (e, t) => {
    const o = ye(gt, e.__scopeDialog), r = s.useRef(!1), n = s.useRef(!1);
    return /* @__PURE__ */ c(
      bu,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          var l, i;
          (l = e.onCloseAutoFocus) == null || l.call(e, a), a.defaultPrevented || (r.current || (i = o.triggerRef.current) == null || i.focus(), a.preventDefault()), r.current = !1, n.current = !1;
        },
        onInteractOutside: (a) => {
          var u, p;
          (u = e.onInteractOutside) == null || u.call(e, a), a.defaultPrevented || (r.current = !0, a.detail.originalEvent.type === "pointerdown" && (n.current = !0));
          const l = a.target;
          ((p = o.triggerRef.current) == null ? void 0 : p.contains(l)) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && n.current && a.preventDefault();
        }
      }
    );
  }
), bu = s.forwardRef(
  (e, t) => {
    const { __scopeDialog: o, trapFocus: r, onOpenAutoFocus: n, onCloseAutoFocus: a, ...l } = e, i = ye(gt, o);
    return $o(), /* @__PURE__ */ c(Ee, { children: /* @__PURE__ */ c(
      Ht,
      {
        asChild: !0,
        loop: !0,
        trapped: r,
        onMountAutoFocus: n,
        onUnmountAutoFocus: a,
        children: /* @__PURE__ */ c(
          tt,
          {
            role: "dialog",
            id: i.contentId,
            "aria-describedby": i.descriptionId,
            "aria-labelledby": i.titleId,
            "data-state": qn(i.open),
            ...l,
            ref: t,
            deferPointerDownOutside: !0,
            onDismiss: () => i.onOpenChange(!1)
          }
        )
      }
    ) });
  }
), yu = "DialogTitle", sr = s.forwardRef(
  (e, t) => {
    const { __scopeDialog: o, ...r } = e, n = ye(yu, o);
    return /* @__PURE__ */ c(M.h2, { id: n.titleId, ...r, ref: t });
  }
);
sr.displayName = yu;
var wu = "DialogDescription", lr = s.forwardRef(
  (e, t) => {
    const { __scopeDialog: o, ...r } = e, n = ye(wu, o);
    return /* @__PURE__ */ c(M.p, { id: n.descriptionId, ...r, ref: t });
  }
);
lr.displayName = wu;
var xu = "DialogClose", Zt = s.forwardRef(
  (e, t) => {
    const { __scopeDialog: o, ...r } = e, n = ye(xu, o);
    return /* @__PURE__ */ c(
      M.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: N(e.onClick, () => n.onOpenChange(!1))
      }
    );
  }
);
Zt.displayName = xu;
function qn(e) {
  return e ? "open" : "closed";
}
const B0 = Kn, H0 = jn, W0 = Zt, Oy = Xn, Cu = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  nr,
  {
    ref: o,
    className: S(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      e
    ),
    ...t
  }
));
Cu.displayName = nr.displayName;
const Fy = Fe(
  "fixed z-50 gap-4 bg-[color:var(--ds-theme-surface-default)] p-6 shadow-[var(--ds-theme-shadow-lg)] transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-[color:var(--ds-theme-border-subtle)] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t border-[color:var(--ds-theme-border-subtle)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-[color:var(--ds-theme-border-subtle)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l border-[color:var(--ds-theme-border-subtle)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
), Ly = s.forwardRef(({ side: e = "right", className: t, children: o, ...r }, n) => /* @__PURE__ */ O(Oy, { children: [
  /* @__PURE__ */ c(Cu, {}),
  /* @__PURE__ */ O(
    ar,
    {
      ref: n,
      className: S(Fy({ side: e }), t),
      ...r,
      children: [
        o,
        /* @__PURE__ */ c(Zt, { className: "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-theme-focus-ring)] disabled:pointer-events-none", children: /* @__PURE__ */ c("span", { className: "text-sm font-semibold", children: "✕" }) })
      ]
    }
  )
] }));
Ly.displayName = ar.displayName;
const $y = ({ className: e, ...t }) => /* @__PURE__ */ c(
  "div",
  {
    className: S("flex flex-col space-y-2 text-center sm:text-left", e),
    ...t
  }
);
$y.displayName = "SheetHeader";
const zy = ({ className: e, ...t }) => /* @__PURE__ */ c(
  "div",
  {
    className: S("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", e),
    ...t
  }
);
zy.displayName = "SheetFooter";
const By = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  sr,
  {
    ref: o,
    className: S("text-lg font-semibold text-[color:var(--ds-theme-content-default)]", e),
    ...t
  }
));
By.displayName = sr.displayName;
const Hy = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  lr,
  {
    ref: o,
    className: S("text-sm text-[color:var(--ds-theme-content-muted)]", e),
    ...t
  }
));
Hy.displayName = lr.displayName;
var Su = "AlertDialog", [Wy] = J(Su, [
  mu
]), $e = mu(), Ru = (e) => {
  const { __scopeAlertDialog: t, ...o } = e, r = $e(t);
  return /* @__PURE__ */ c(Kn, { ...r, ...o, modal: !0 });
};
Ru.displayName = Su;
var Gy = "AlertDialogTrigger", Nu = s.forwardRef(
  (e, t) => {
    const { __scopeAlertDialog: o, ...r } = e, n = $e(o);
    return /* @__PURE__ */ c(jn, { ...n, ...r, ref: t });
  }
);
Nu.displayName = Gy;
var Vy = "AlertDialogPortal", Eu = (e) => {
  const { __scopeAlertDialog: t, ...o } = e, r = $e(t);
  return /* @__PURE__ */ c(Xn, { ...r, ...o });
};
Eu.displayName = Vy;
var Uy = "AlertDialogOverlay", Pu = s.forwardRef(
  (e, t) => {
    const { __scopeAlertDialog: o, ...r } = e, n = $e(o);
    return /* @__PURE__ */ c(nr, { ...n, ...r, ref: t });
  }
);
Pu.displayName = Uy;
var Au = "AlertDialogContent", [Ky, jy] = Wy(Au), _u = s.forwardRef(
  (e, t) => {
    const { __scopeAlertDialog: o, children: r, ...n } = e, a = $e(o), l = s.useRef(null), i = L(t, l), u = s.useRef(null);
    return /* @__PURE__ */ c(Ky, { scope: o, cancelRef: u, children: /* @__PURE__ */ c(
      ar,
      {
        role: "alertdialog",
        ...a,
        ...n,
        ref: i,
        onOpenAutoFocus: N(n.onOpenAutoFocus, (p) => {
          var f;
          p.preventDefault(), (f = u.current) == null || f.focus({ preventScroll: !0 });
        }),
        onPointerDownOutside: (p) => p.preventDefault(),
        onInteractOutside: (p) => p.preventDefault(),
        children: r
      }
    ) });
  }
);
_u.displayName = Au;
var Yy = "AlertDialogTitle", Tu = s.forwardRef(
  (e, t) => {
    const { __scopeAlertDialog: o, ...r } = e, n = $e(o);
    return /* @__PURE__ */ c(sr, { ...n, ...r, ref: t });
  }
);
Tu.displayName = Yy;
var Xy = "AlertDialogDescription", Mu = s.forwardRef((e, t) => {
  const { __scopeAlertDialog: o, ...r } = e, n = $e(o);
  return /* @__PURE__ */ c(lr, { ...n, ...r, ref: t });
});
Mu.displayName = Xy;
var qy = "AlertDialogAction", Iu = s.forwardRef(
  (e, t) => {
    const { __scopeAlertDialog: o, ...r } = e, n = $e(o);
    return /* @__PURE__ */ c(Zt, { ...n, ...r, ref: t });
  }
);
Iu.displayName = qy;
var Du = "AlertDialogCancel", ku = s.forwardRef(
  (e, t) => {
    const { __scopeAlertDialog: o, ...r } = e, { cancelRef: n } = jy(Du, o), a = $e(o), l = L(t, n);
    return /* @__PURE__ */ c(Zt, { ...a, ...r, ref: l });
  }
);
ku.displayName = Du;
var Zy = Ru, Qy = Nu, Jy = Eu, Ou = Pu, Fu = _u, Lu = Iu, $u = ku, zu = Tu, Bu = Mu;
const G0 = Zy, V0 = Qy, ew = Jy, Hu = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Ou,
  {
    ref: o,
    className: S(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      e
    ),
    ...t
  }
));
Hu.displayName = Ou.displayName;
const tw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ O(ew, { children: [
  /* @__PURE__ */ c(Hu, {}),
  /* @__PURE__ */ c(
    Fu,
    {
      ref: o,
      className: S(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-6 shadow-[var(--ds-theme-shadow-lg)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 rounded-xl focus:outline-none",
        e
      ),
      ...t
    }
  )
] }));
tw.displayName = Fu.displayName;
const ow = ({
  className: e,
  ...t
}) => /* @__PURE__ */ c(
  "div",
  {
    className: S(
      "flex flex-col space-y-2 text-center sm:text-left",
      e
    ),
    ...t
  }
);
ow.displayName = "AlertDialogHeader";
const rw = ({
  className: e,
  ...t
}) => /* @__PURE__ */ c(
  "div",
  {
    className: S(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      e
    ),
    ...t
  }
);
rw.displayName = "AlertDialogFooter";
const nw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  zu,
  {
    ref: o,
    className: S("text-lg font-semibold text-[color:var(--ds-theme-content-default)]", e),
    ...t
  }
));
nw.displayName = zu.displayName;
const aw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Bu,
  {
    ref: o,
    className: S("text-sm text-[color:var(--ds-theme-content-muted)]", e),
    ...t
  }
));
aw.displayName = Bu.displayName;
const sw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Lu,
  {
    ref: o,
    className: S(We({ variant: "primary" }), e),
    ...t
  }
));
sw.displayName = Lu.displayName;
const lw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  $u,
  {
    ref: o,
    className: S(
      We({ variant: "secondary" }),
      "mt-2 sm:mt-0",
      e
    ),
    ...t
  }
));
lw.displayName = $u.displayName;
var ir = "Tabs", [iw] = J(ir, [
  Ae
]), Wu = Ae(), [cw, Zn] = iw(ir), Gu = s.forwardRef(
  (e, t) => {
    const {
      __scopeTabs: o,
      value: r,
      onValueChange: n,
      defaultValue: a,
      orientation: l = "horizontal",
      dir: i,
      activationMode: u = "automatic",
      ...p
    } = e, f = Pe(i), [d, v] = oe({
      prop: r,
      onChange: n,
      defaultProp: a ?? "",
      caller: ir
    });
    return /* @__PURE__ */ c(
      cw,
      {
        scope: o,
        baseId: ne(),
        value: d,
        onValueChange: v,
        orientation: l,
        dir: f,
        activationMode: u,
        children: /* @__PURE__ */ c(
          M.div,
          {
            dir: f,
            "data-orientation": l,
            ...p,
            ref: t
          }
        )
      }
    );
  }
);
Gu.displayName = ir;
var Vu = "TabsList", Uu = s.forwardRef(
  (e, t) => {
    const { __scopeTabs: o, loop: r = !0, ...n } = e, a = Zn(Vu, o), l = Wu(o);
    return /* @__PURE__ */ c(
      $t,
      {
        asChild: !0,
        ...l,
        orientation: a.orientation,
        dir: a.dir,
        loop: r,
        children: /* @__PURE__ */ c(
          M.div,
          {
            role: "tablist",
            "aria-orientation": a.orientation,
            ...n,
            ref: t
          }
        )
      }
    );
  }
);
Uu.displayName = Vu;
var Ku = "TabsTrigger", ju = s.forwardRef(
  (e, t) => {
    const { __scopeTabs: o, value: r, disabled: n = !1, ...a } = e, l = Zn(Ku, o), i = Wu(o), u = qu(l.baseId, r), p = Zu(l.baseId, r), f = r === l.value;
    return /* @__PURE__ */ c(
      zt,
      {
        asChild: !0,
        ...i,
        focusable: !n,
        active: f,
        children: /* @__PURE__ */ c(
          M.button,
          {
            type: "button",
            role: "tab",
            "aria-selected": f,
            "aria-controls": p,
            "data-state": f ? "active" : "inactive",
            "data-disabled": n ? "" : void 0,
            disabled: n,
            id: u,
            ...a,
            ref: t,
            onMouseDown: N(e.onMouseDown, (d) => {
              !n && d.button === 0 && d.ctrlKey === !1 ? l.onValueChange(r) : d.preventDefault();
            }),
            onKeyDown: N(e.onKeyDown, (d) => {
              [" ", "Enter"].includes(d.key) && l.onValueChange(r);
            }),
            onFocus: N(e.onFocus, () => {
              const d = l.activationMode !== "manual";
              !f && !n && d && l.onValueChange(r);
            })
          }
        )
      }
    );
  }
);
ju.displayName = Ku;
var Yu = "TabsContent", Xu = s.forwardRef(
  (e, t) => {
    const { __scopeTabs: o, value: r, forceMount: n, children: a, ...l } = e, i = Zn(Yu, o), u = qu(i.baseId, r), p = Zu(i.baseId, r), f = r === i.value, d = s.useRef(f);
    return s.useEffect(() => {
      const v = requestAnimationFrame(() => d.current = !1);
      return () => cancelAnimationFrame(v);
    }, []), /* @__PURE__ */ c(ee, { present: n || f, children: ({ present: v }) => /* @__PURE__ */ c(
      M.div,
      {
        "data-state": f ? "active" : "inactive",
        "data-orientation": i.orientation,
        role: "tabpanel",
        "aria-labelledby": u,
        hidden: !v,
        id: p,
        tabIndex: 0,
        ...l,
        ref: t,
        style: {
          ...e.style,
          animationDuration: d.current ? "0s" : void 0
        },
        children: v && a
      }
    ) });
  }
);
Xu.displayName = Yu;
function qu(e, t) {
  return `${e}-trigger-${t}`;
}
function Zu(e, t) {
  return `${e}-content-${t}`;
}
var uw = Gu, Qu = Uu, Ju = ju, ed = Xu;
const U0 = uw, dw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Qu,
  {
    ref: o,
    className: S(
      "inline-flex h-10 items-center justify-center rounded-xl bg-[color:var(--ds-theme-surface-subdued)] p-1 text-[color:var(--ds-theme-content-muted)]",
      e
    ),
    ...t
  }
));
dw.displayName = Qu.displayName;
const fw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Ju,
  {
    ref: o,
    className: S(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-theme-focus-ring)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[color:var(--ds-theme-surface-default)] data-[state=active]:text-[color:var(--ds-theme-content-default)] data-[state=active]:shadow-[var(--ds-theme-shadow-sm)]",
      e
    ),
    ...t
  }
));
fw.displayName = Ju.displayName;
const pw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  ed,
  {
    ref: o,
    className: S(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-theme-focus-ring)]",
      e
    ),
    ...t
  }
));
pw.displayName = ed.displayName;
const vw = s.forwardRef(({ ...e }, t) => /* @__PURE__ */ c("nav", { ref: t, "aria-label": "breadcrumb", ...e }));
vw.displayName = "Breadcrumb";
const mw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "ol",
  {
    ref: o,
    className: S(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-[color:var(--ds-theme-content-muted)] sm:gap-2.5",
      e
    ),
    ...t
  }
));
mw.displayName = "BreadcrumbList";
const hw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "li",
  {
    ref: o,
    className: S("inline-flex items-center gap-1.5", e),
    ...t
  }
));
hw.displayName = "BreadcrumbItem";
const gw = s.forwardRef(({ asChild: e, className: t, ...o }, r) => /* @__PURE__ */ c(
  e ? tp : "a",
  {
    ref: r,
    className: S("transition-colors hover:text-[color:var(--ds-theme-content-default)]", t),
    ...o
  }
));
gw.displayName = "BreadcrumbLink";
const bw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "span",
  {
    ref: o,
    role: "link",
    "aria-disabled": "true",
    "aria-current": "page",
    className: S("font-normal text-[color:var(--ds-theme-content-default)]", e),
    ...t
  }
));
bw.displayName = "BreadcrumbPage";
const yw = ({
  children: e,
  className: t,
  ...o
}) => /* @__PURE__ */ c(
  "li",
  {
    role: "presentation",
    "aria-hidden": "true",
    className: S("[&>svg]:size-3.5", t),
    ...o,
    children: e ?? /* @__PURE__ */ c("span", { className: "opacity-40", children: "/" })
  }
);
yw.displayName = "BreadcrumbSeparator";
const ww = ({
  className: e,
  ...t
}) => /* @__PURE__ */ c(
  "span",
  {
    role: "presentation",
    "aria-hidden": "true",
    className: S("flex h-9 w-9 items-center justify-center", e),
    ...t,
    children: /* @__PURE__ */ c("span", { className: "text-xs", children: "•••" })
  }
);
ww.displayName = "BreadcrumbEllipsis";
const xw = ({ className: e, ...t }) => /* @__PURE__ */ c(
  "nav",
  {
    role: "navigation",
    "aria-label": "pagination",
    className: S("mx-auto flex w-full justify-center", e),
    ...t
  }
);
xw.displayName = "Pagination";
const Cw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "ul",
  {
    ref: o,
    className: S("flex flex-row items-center gap-1", e),
    ...t
  }
));
Cw.displayName = "PaginationContent";
const Sw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c("li", { ref: o, className: S("list-none", e), ...t }));
Sw.displayName = "PaginationItem";
const Qn = ({
  className: e,
  isActive: t,
  ...o
}) => /* @__PURE__ */ c(
  "a",
  {
    "aria-current": t ? "page" : void 0,
    className: S(
      We({
        variant: t ? "secondary" : "ghost",
        size: "sm"
      }),
      "w-9 h-9 p-0 flex items-center justify-center font-medium rounded-lg text-sm transition-all",
      e
    ),
    ...o
  }
);
Qn.displayName = "PaginationLink";
const Rw = ({
  className: e,
  ...t
}) => /* @__PURE__ */ O(
  Qn,
  {
    "aria-label": "Go to previous page",
    className: S("gap-1 px-2.5 w-auto", e),
    ...t,
    children: [
      /* @__PURE__ */ c("span", { children: "◀" }),
      /* @__PURE__ */ c("span", { children: "Prev" })
    ]
  }
);
Rw.displayName = "PaginationPrevious";
const Nw = ({
  className: e,
  ...t
}) => /* @__PURE__ */ O(
  Qn,
  {
    "aria-label": "Go to next page",
    className: S("gap-1 px-2.5 w-auto", e),
    ...t,
    children: [
      /* @__PURE__ */ c("span", { children: "Next" }),
      /* @__PURE__ */ c("span", { children: "▶" })
    ]
  }
);
Nw.displayName = "PaginationNext";
const Ew = ({
  className: e,
  ...t
}) => /* @__PURE__ */ c(
  "span",
  {
    "aria-hidden": !0,
    className: S("flex h-9 w-9 items-center justify-center text-xs opacity-50", e),
    ...t,
    children: "•••"
  }
);
Ew.displayName = "PaginationEllipsis";
var we = "Accordion", Pw = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"], [Jn, Aw, _w] = yt(we), [cr] = J(we, [
  _w,
  ol
]), ea = ol(), td = s.forwardRef(
  (e, t) => {
    const { type: o, ...r } = e, n = r, a = r;
    return /* @__PURE__ */ c(Jn.Provider, { scope: e.__scopeAccordion, children: o === "multiple" ? /* @__PURE__ */ c(Dw, { ...a, ref: t }) : /* @__PURE__ */ c(Iw, { ...n, ref: t }) });
  }
);
td.displayName = we;
var [od, Tw] = cr(we), [rd, Mw] = cr(
  we,
  { collapsible: !1 }
), Iw = s.forwardRef(
  (e, t) => {
    const {
      value: o,
      defaultValue: r,
      onValueChange: n = () => {
      },
      collapsible: a = !1,
      ...l
    } = e, [i, u] = oe({
      prop: o,
      defaultProp: r ?? "",
      onChange: n,
      caller: we
    });
    return /* @__PURE__ */ c(
      od,
      {
        scope: e.__scopeAccordion,
        value: s.useMemo(() => i ? [i] : [], [i]),
        onItemOpen: u,
        onItemClose: s.useCallback(() => a && u(""), [a, u]),
        children: /* @__PURE__ */ c(rd, { scope: e.__scopeAccordion, collapsible: a, children: /* @__PURE__ */ c(nd, { ...l, ref: t }) })
      }
    );
  }
), Dw = s.forwardRef((e, t) => {
  const {
    value: o,
    defaultValue: r,
    onValueChange: n = () => {
    },
    ...a
  } = e, [l, i] = oe({
    prop: o,
    defaultProp: r ?? [],
    onChange: n,
    caller: we
  }), u = s.useCallback(
    (f) => i((d = []) => [...d, f]),
    [i]
  ), p = s.useCallback(
    (f) => i((d = []) => d.filter((v) => v !== f)),
    [i]
  );
  return /* @__PURE__ */ c(
    od,
    {
      scope: e.__scopeAccordion,
      value: l,
      onItemOpen: u,
      onItemClose: p,
      children: /* @__PURE__ */ c(rd, { scope: e.__scopeAccordion, collapsible: !0, children: /* @__PURE__ */ c(nd, { ...a, ref: t }) })
    }
  );
}), [kw, ur] = cr(we), nd = s.forwardRef(
  (e, t) => {
    const { __scopeAccordion: o, disabled: r, dir: n, orientation: a = "vertical", ...l } = e, i = s.useRef(null), u = L(i, t), p = Aw(o), d = Pe(n) === "ltr", v = N(e.onKeyDown, (h) => {
      var I;
      if (!Pw.includes(h.key)) return;
      const g = h.target, m = p().filter((_) => {
        var D;
        return !((D = _.ref.current) != null && D.disabled);
      }), b = m.findIndex((_) => _.ref.current === g), w = m.length;
      if (b === -1) return;
      h.preventDefault();
      let y = b;
      const x = 0, C = w - 1, R = () => {
        y = b + 1, y > C && (y = x);
      }, E = () => {
        y = b - 1, y < x && (y = C);
      };
      switch (h.key) {
        case "Home":
          y = x;
          break;
        case "End":
          y = C;
          break;
        case "ArrowRight":
          a === "horizontal" && (d ? R() : E());
          break;
        case "ArrowDown":
          a === "vertical" && R();
          break;
        case "ArrowLeft":
          a === "horizontal" && (d ? E() : R());
          break;
        case "ArrowUp":
          a === "vertical" && E();
          break;
      }
      const P = y % w;
      (I = m[P].ref.current) == null || I.focus();
    });
    return /* @__PURE__ */ c(
      kw,
      {
        scope: o,
        disabled: r,
        direction: n,
        orientation: a,
        children: /* @__PURE__ */ c(Jn.Slot, { scope: o, children: /* @__PURE__ */ c(
          M.div,
          {
            ...l,
            "data-orientation": a,
            ref: u,
            onKeyDown: r ? void 0 : v
          }
        ) })
      }
    );
  }
), Eo = "AccordionItem", [Ow, ta] = cr(Eo), ad = s.forwardRef(
  (e, t) => {
    const { __scopeAccordion: o, value: r, ...n } = e, a = ur(Eo, o), l = Tw(Eo, o), i = ea(o), u = ne(), p = r && l.value.includes(r) || !1, f = a.disabled || e.disabled;
    return /* @__PURE__ */ c(
      Ow,
      {
        scope: o,
        open: p,
        disabled: f,
        triggerId: u,
        children: /* @__PURE__ */ c(
          al,
          {
            "data-orientation": a.orientation,
            "data-state": dd(p),
            ...i,
            ...n,
            ref: t,
            disabled: f,
            open: p,
            onOpenChange: (d) => {
              d ? l.onItemOpen(r) : l.onItemClose(r);
            }
          }
        )
      }
    );
  }
);
ad.displayName = Eo;
var sd = "AccordionHeader", ld = s.forwardRef(
  (e, t) => {
    const { __scopeAccordion: o, ...r } = e, n = ur(we, o), a = ta(sd, o);
    return /* @__PURE__ */ c(
      M.h3,
      {
        "data-orientation": n.orientation,
        "data-state": dd(a.open),
        "data-disabled": a.disabled ? "" : void 0,
        ...r,
        ref: t
      }
    );
  }
);
ld.displayName = sd;
var Hr = "AccordionTrigger", id = s.forwardRef(
  (e, t) => {
    const { __scopeAccordion: o, ...r } = e, n = ur(we, o), a = ta(Hr, o), l = Mw(Hr, o), i = ea(o);
    return /* @__PURE__ */ c(Jn.ItemSlot, { scope: o, children: /* @__PURE__ */ c(
      Pv,
      {
        "aria-disabled": a.open && !l.collapsible || void 0,
        "data-orientation": n.orientation,
        id: a.triggerId,
        ...i,
        ...r,
        ref: t
      }
    ) });
  }
);
id.displayName = Hr;
var cd = "AccordionContent", ud = s.forwardRef(
  (e, t) => {
    const { __scopeAccordion: o, ...r } = e, n = ur(we, o), a = ta(cd, o), l = ea(o);
    return /* @__PURE__ */ c(
      Av,
      {
        role: "region",
        "aria-labelledby": a.triggerId,
        "data-orientation": n.orientation,
        ...l,
        ...r,
        ref: t,
        style: {
          "--radix-accordion-content-height": "var(--radix-collapsible-content-height)",
          "--radix-accordion-content-width": "var(--radix-collapsible-content-width)",
          ...e.style
        }
      }
    );
  }
);
ud.displayName = cd;
function dd(e) {
  return e ? "open" : "closed";
}
var Fw = td, Lw = ad, $w = ld, fd = id, pd = ud;
const K0 = Fw, zw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Lw,
  {
    ref: o,
    className: S("border-b border-[color:var(--ds-theme-border-subtle)]", e),
    ...t
  }
));
zw.displayName = "AccordionItem";
const Bw = s.forwardRef(({ className: e, children: t, ...o }, r) => /* @__PURE__ */ c($w, { className: "flex", children: /* @__PURE__ */ O(
  fd,
  {
    ref: r,
    className: S(
      "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>span]:rotate-180 text-left text-[color:var(--ds-theme-content-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-theme-focus-ring)] rounded-lg",
      e
    ),
    ...o,
    children: [
      t,
      /* @__PURE__ */ c("span", { className: "text-xs transition-transform duration-200 opacity-50 shrink-0", children: "▼" })
    ]
  }
) }));
Bw.displayName = fd.displayName;
const Hw = s.forwardRef(({ className: e, children: t, ...o }, r) => /* @__PURE__ */ c(
  pd,
  {
    ref: r,
    className: S(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down text-[color:var(--ds-theme-content-muted)]",
      e
    ),
    ...o,
    children: /* @__PURE__ */ c("div", { className: "pb-4 pt-0", children: t })
  }
));
Hw.displayName = pd.displayName;
function Ww({
  className: e,
  selected: t,
  onSelect: o,
  showOutsideDays: r = !0,
  ...n
}) {
  const [a, l] = s.useState(() => t || /* @__PURE__ */ new Date()), i = a.getFullYear(), u = a.getMonth(), p = a.toLocaleString("default", { month: "long" }), f = new Date(i, u + 1, 0).getDate(), d = new Date(i, u, 1).getDay(), v = new Date(i, u, 0).getDate(), h = () => {
    l(new Date(i, u - 1, 1));
  }, g = () => {
    l(new Date(i, u + 1, 1));
  }, m = [];
  for (let C = d - 1; C >= 0; C--)
    m.push({
      date: new Date(i, u - 1, v - C),
      isOutside: !0
    });
  for (let C = 1; C <= f; C++)
    m.push({
      date: new Date(i, u, C),
      isOutside: !1
    });
  const b = 42 - m.length;
  for (let C = 1; C <= b; C++)
    m.push({
      date: new Date(i, u + 1, C),
      isOutside: !0
    });
  const w = (C) => {
    const R = /* @__PURE__ */ new Date();
    return C.getDate() === R.getDate() && C.getMonth() === R.getMonth() && C.getFullYear() === R.getFullYear();
  }, y = (C) => t ? C.getDate() === t.getDate() && C.getMonth() === t.getMonth() && C.getFullYear() === t.getFullYear() : !1, x = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return /* @__PURE__ */ O(
    "div",
    {
      className: S(
        "p-4 bg-[color:var(--ds-theme-surface-default)] border border-[color:var(--ds-theme-border-subtle)] rounded-xl shadow-[var(--ds-theme-shadow-md)] w-[280px]",
        e
      ),
      ...n,
      children: [
        /* @__PURE__ */ O("div", { className: "flex justify-between items-center mb-4", children: [
          /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              onClick: h,
              className: S(
                We({ variant: "ghost", size: "sm" }),
                "h-7 w-7 p-0 flex items-center justify-center rounded-lg hover:bg-[color:var(--ds-theme-surface-subdued)] cursor-pointer text-sm text-[color:var(--ds-theme-content-muted)]"
              ),
              children: "◀"
            }
          ),
          /* @__PURE__ */ O("span", { className: "text-sm font-semibold capitalize text-[color:var(--ds-theme-content-default)]", children: [
            p,
            " ",
            i
          ] }),
          /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              onClick: g,
              className: S(
                We({ variant: "ghost", size: "sm" }),
                "h-7 w-7 p-0 flex items-center justify-center rounded-lg hover:bg-[color:var(--ds-theme-surface-subdued)] cursor-pointer text-sm text-[color:var(--ds-theme-content-muted)]"
              ),
              children: "▶"
            }
          )
        ] }),
        /* @__PURE__ */ c("div", { className: "grid grid-cols-7 gap-1 text-center mb-2", children: x.map((C) => /* @__PURE__ */ c(
          "span",
          {
            className: "text-xs font-semibold text-[color:var(--ds-theme-content-muted)]",
            children: C
          },
          C
        )) }),
        /* @__PURE__ */ c("div", { className: "grid grid-cols-7 gap-1", children: m.map(({ date: C, isOutside: R }, E) => {
          const P = y(C), I = w(C);
          return R && !r ? /* @__PURE__ */ c("div", { className: "h-8 w-8" }, E) : /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              onClick: () => o == null ? void 0 : o(C),
              className: S(
                "h-8 w-8 text-xs font-medium rounded-lg flex items-center justify-center transition-all cursor-pointer",
                R ? "text-[color:var(--ds-theme-content-muted)] opacity-40 hover:opacity-100 hover:bg-[color:var(--ds-theme-surface-subdued)]" : "text-[color:var(--ds-theme-content-default)] hover:bg-[color:var(--ds-theme-surface-subdued)]",
                I && "border border-[color:var(--ds-theme-border-subtle)] font-bold text-[color:var(--ds-theme-content-default)]",
                P && "bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-default)] font-bold shadow-[var(--ds-theme-shadow-sm)]"
              ),
              children: C.getDate()
            },
            E
          );
        }) })
      ]
    }
  );
}
Ww.displayName = "Calendar";
const Gw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c("div", { className: "relative w-full overflow-auto rounded-xl border border-[color:var(--ds-theme-border-subtle)]", children: /* @__PURE__ */ c(
  "table",
  {
    ref: o,
    className: S("w-full caption-bottom text-sm border-collapse", e),
    ...t
  }
) }));
Gw.displayName = "Table";
const Vw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c("thead", { ref: o, className: S("[&_tr]:border-b bg-[color:var(--ds-theme-surface-subdued)]/20", e), ...t }));
Vw.displayName = "TableHeader";
const Uw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "tbody",
  {
    ref: o,
    className: S("[&_tr:last-child]:border-0", e),
    ...t
  }
));
Uw.displayName = "TableBody";
const Kw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "tfoot",
  {
    ref: o,
    className: S(
      "border-t bg-[color:var(--ds-theme-surface-subdued)]/50 font-medium [&>tr]:last:border-b-0",
      e
    ),
    ...t
  }
));
Kw.displayName = "TableFooter";
const jw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "tr",
  {
    ref: o,
    className: S(
      "border-b border-[color:var(--ds-theme-border-subtle)] transition-colors hover:bg-[color:var(--ds-theme-surface-subdued)]/40 data-[state=selected]:bg-[color:var(--ds-theme-surface-subdued)]",
      e
    ),
    ...t
  }
));
jw.displayName = "TableRow";
const Yw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "th",
  {
    ref: o,
    className: S(
      "h-10 px-4 text-left align-middle font-medium text-[color:var(--ds-theme-content-muted)] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      e
    ),
    ...t
  }
));
Yw.displayName = "TableHead";
const Xw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "td",
  {
    ref: o,
    className: S(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-[color:var(--ds-theme-content-default)]",
      e
    ),
    ...t
  }
));
Xw.displayName = "TableCell";
const qw = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "caption",
  {
    ref: o,
    className: S("mt-4 text-xs text-[color:var(--ds-theme-content-muted)] pb-2", e),
    ...t
  }
));
qw.displayName = "TableCaption";
var oa = "Progress", ra = 100, [Zw] = J(oa), [Qw, Jw] = Zw(oa), vd = s.forwardRef(
  (e, t) => {
    const {
      __scopeProgress: o,
      value: r = null,
      max: n,
      getValueLabel: a = ex,
      ...l
    } = e;
    (n || n === 0) && !Ba(n) && console.error(tx(`${n}`, "Progress"));
    const i = Ba(n) ? n : ra;
    r !== null && !Ha(r, i) && console.error(ox(`${r}`, "Progress"));
    const u = Ha(r, i) ? r : null, p = Po(u) ? a(u, i) : void 0;
    return /* @__PURE__ */ c(Qw, { scope: o, value: u, max: i, children: /* @__PURE__ */ c(
      M.div,
      {
        "aria-valuemax": i,
        "aria-valuemin": 0,
        "aria-valuenow": Po(u) ? u : void 0,
        "aria-valuetext": p,
        role: "progressbar",
        "data-state": gd(u, i),
        "data-value": u ?? void 0,
        "data-max": i,
        ...l,
        ref: t
      }
    ) });
  }
);
vd.displayName = oa;
var md = "ProgressIndicator", hd = s.forwardRef(
  (e, t) => {
    const { __scopeProgress: o, ...r } = e, n = Jw(md, o);
    return /* @__PURE__ */ c(
      M.div,
      {
        "data-state": gd(n.value, n.max),
        "data-value": n.value ?? void 0,
        "data-max": n.max,
        ...r,
        ref: t
      }
    );
  }
);
hd.displayName = md;
function ex(e, t) {
  return `${Math.round(e / t * 100)}%`;
}
function gd(e, t) {
  return e == null ? "indeterminate" : e === t ? "complete" : "loading";
}
function Po(e) {
  return typeof e == "number";
}
function Ba(e) {
  return Po(e) && !isNaN(e) && e > 0;
}
function Ha(e, t) {
  return Po(e) && !isNaN(e) && e <= t && e >= 0;
}
function tx(e, t) {
  return `Invalid prop \`max\` of value \`${e}\` supplied to \`${t}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${ra}\`.`;
}
function ox(e, t) {
  return `Invalid prop \`value\` of value \`${e}\` supplied to \`${t}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${ra} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var bd = vd, rx = hd;
const nx = s.forwardRef(({ className: e, value: t, ...o }, r) => /* @__PURE__ */ c(
  bd,
  {
    ref: r,
    className: S(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--ds-theme-surface-subdued)]",
      e
    ),
    ...o,
    children: /* @__PURE__ */ c(
      rx,
      {
        className: "h-full w-full flex-1 bg-[color:var(--ds-theme-content-default)] transition-all duration-300 ease-out",
        style: { transform: `translateX(-${String(100 - (t || 0))}%)` }
      }
    )
  }
));
nx.displayName = bd.displayName;
const ax = s.forwardRef(
  ({ className: e, value: t, onChange: o, maxLength: r = 6, ...n }, a) => {
    const l = s.useRef([]), i = (f, d) => {
      var m;
      const v = d.target.value;
      if (!/^\d*$/.test(v)) return;
      const h = t.split("");
      h[f] = v.slice(-1);
      const g = h.join("").slice(0, r);
      o(g), v && f < r - 1 && ((m = l.current[f + 1]) == null || m.focus());
    }, u = (f, d) => {
      var v;
      if (d.key === "Backspace")
        if (!t[f] && f > 0) {
          const h = t.split("");
          h[f - 1] = "", o(h.join("")), (v = l.current[f - 1]) == null || v.focus();
        } else {
          const h = t.split("");
          h[f] = "", o(h.join(""));
        }
    }, p = Array.from({ length: r }, (f, d) => t[d] || "");
    return /* @__PURE__ */ c("div", { ref: a, className: S("flex items-center gap-2", e), ...n, children: p.map((f, d) => /* @__PURE__ */ c(
      "input",
      {
        type: "text",
        inputMode: "numeric",
        pattern: "\\d*",
        maxLength: 1,
        value: f,
        ref: (v) => {
          v && (l.current[d] = v);
        },
        onChange: (v) => {
          i(d, v);
        },
        onKeyDown: (v) => {
          u(d, v);
        },
        className: "w-10 h-12 text-center text-lg font-bold border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--ds-focus-ring-color)] text-[color:var(--ds-theme-content-default)] transition-all"
      },
      d
    )) });
  }
);
ax.displayName = "InputOTP";
const yd = s.createContext(null);
function wd() {
  const e = s.useContext(yd);
  if (!e)
    throw new Error("useCarousel must be used within a <Carousel />");
  return e;
}
const sx = s.forwardRef(({ className: e, children: t, ...o }, r) => {
  const n = s.useRef(null), [a, l] = s.useState(!1), [i, u] = s.useState(!0), p = s.useCallback(() => {
    const v = n.current;
    v && (l(v.scrollLeft > 0), u(v.scrollLeft < v.scrollWidth - v.clientWidth - 1));
  }, []), f = s.useCallback(() => {
    const v = n.current;
    v && v.scrollBy({ left: -v.clientWidth, behavior: "smooth" });
  }, []), d = s.useCallback(() => {
    const v = n.current;
    v && v.scrollBy({ left: v.clientWidth, behavior: "smooth" });
  }, []);
  return s.useEffect(() => {
    const v = n.current;
    return v && (v.addEventListener("scroll", p), p(), window.addEventListener("resize", p)), () => {
      v == null || v.removeEventListener("scroll", p), window.removeEventListener("resize", p);
    };
  }, [p]), /* @__PURE__ */ c(
    yd.Provider,
    {
      value: {
        scrollPrev: f,
        scrollNext: d,
        canScrollPrev: a,
        canScrollNext: i
      },
      children: /* @__PURE__ */ c(
        "div",
        {
          ref: r,
          className: S("relative w-full overflow-hidden", e),
          ...o,
          children: /* @__PURE__ */ c(
            "div",
            {
              ref: n,
              className: "flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none scrollbar-hide",
              children: t
            }
          )
        }
      )
    }
  );
});
sx.displayName = "Carousel";
const lx = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "div",
  {
    ref: o,
    className: S("flex w-full", e),
    ...t
  }
));
lx.displayName = "CarouselContent";
const ix = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  "div",
  {
    ref: o,
    className: S(
      "min-w-0 shrink-0 grow-0 basis-full snap-start pl-4",
      e
    ),
    ...t
  }
));
ix.displayName = "CarouselItem";
const cx = s.forwardRef(({ className: e, ...t }, o) => {
  const { scrollPrev: r, canScrollPrev: n } = wd();
  return /* @__PURE__ */ c(
    "button",
    {
      ref: o,
      type: "button",
      onClick: r,
      disabled: !n,
      className: S(
        We({ variant: "ghost", size: "sm" }),
        "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none z-10 text-xs font-bold text-[color:var(--ds-theme-content-default)]",
        e
      ),
      ...t,
      children: "◀"
    }
  );
});
cx.displayName = "CarouselPrevious";
const ux = s.forwardRef(({ className: e, ...t }, o) => {
  const { scrollNext: r, canScrollNext: n } = wd();
  return /* @__PURE__ */ c(
    "button",
    {
      ref: o,
      type: "button",
      onClick: r,
      disabled: !n,
      className: S(
        We({ variant: "ghost", size: "sm" }),
        "absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none z-10 text-xs font-bold text-[color:var(--ds-theme-content-default)]",
        e
      ),
      ...t,
      children: "▶"
    }
  );
});
ux.displayName = "CarouselNext";
function j0({
  options: e,
  value: t,
  onValueChange: o,
  placeholder: r = "Select option...",
  searchPlaceholder: n = "Search...",
  emptyText: a = "No options found.",
  className: l
}) {
  const [i, u] = s.useState(!1), [p, f] = s.useState(""), d = e.find((h) => h.value === t), v = e.filter(
    (h) => h.label.toLowerCase().includes(p.toLowerCase())
  );
  return /* @__PURE__ */ O(gg, { open: i, onOpenChange: u, children: [
    /* @__PURE__ */ c(bg, { asChild: !0, children: /* @__PURE__ */ O(
      Za,
      {
        variant: "secondary",
        role: "combobox",
        "aria-expanded": i,
        className: S("w-[200px] justify-between text-left font-normal border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-xl text-sm px-4 py-2 flex items-center", l),
        children: [
          /* @__PURE__ */ c("span", { className: "truncate", children: d ? d.label : r }),
          /* @__PURE__ */ c("span", { className: "ml-2 text-xs opacity-50", children: "▼" })
        ]
      }
    ) }),
    /* @__PURE__ */ O(ii, { className: "w-[200px] p-0 overflow-hidden bg-[color:var(--ds-theme-surface-default)] border border-[color:var(--ds-theme-border-subtle)] rounded-xl shadow-[var(--ds-theme-shadow-md)]", children: [
      /* @__PURE__ */ c("div", { className: "p-2 border-b border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/20", children: /* @__PURE__ */ c(
        Qa,
        {
          placeholder: n,
          value: p,
          onChange: (h) => {
            f(h.target.value);
          },
          className: "h-8 text-xs w-full bg-[color:var(--ds-theme-surface-default)] border border-[color:var(--ds-theme-border-subtle)] rounded-lg px-2"
        }
      ) }),
      /* @__PURE__ */ c("div", { className: "max-h-[200px] overflow-y-auto p-1 space-y-0.5", children: v.length === 0 ? /* @__PURE__ */ c("div", { className: "text-xs text-[color:var(--ds-theme-content-muted)] p-2 text-center", children: a }) : v.map((h) => /* @__PURE__ */ O(
        "button",
        {
          type: "button",
          onClick: () => {
            o == null || o(h.value), u(!1), f("");
          },
          className: S(
            "w-full text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors text-[color:var(--ds-theme-content-default)] flex items-center justify-between",
            h.value === t ? "bg-[color:var(--ds-theme-surface-subdued)] font-semibold" : "hover:bg-[color:var(--ds-theme-surface-subdued)]/60"
          ),
          children: [
            /* @__PURE__ */ c("span", { children: h.label }),
            h.value === t && /* @__PURE__ */ c("span", { className: "text-[10px]", children: "✔" })
          ]
        },
        h.value
      )) })
    ] })
  ] });
}
function Y0({ open: e, onOpenChange: t, children: o, className: r }) {
  return /* @__PURE__ */ c(Ja, { open: e, onClose: () => {
    t(!1);
  }, children: /* @__PURE__ */ c("div", { className: S("w-full max-w-lg overflow-hidden bg-[color:var(--ds-theme-surface-default)] rounded-2xl border border-[color:var(--ds-theme-border-subtle)] shadow-[var(--ds-theme-shadow-lg)]", r), children: o }) });
}
const dx = s.forwardRef(
  ({ className: e, onValueChange: t, onChange: o, ...r }, n) => /* @__PURE__ */ O("div", { className: "flex items-center px-4 border-b border-[color:var(--ds-theme-border-subtle)] h-12 gap-3 bg-[color:var(--ds-theme-surface-subdued)]/10", children: [
    /* @__PURE__ */ c("span", { className: "text-[color:var(--ds-theme-content-muted)] text-sm", children: "🔍" }),
    /* @__PURE__ */ c(
      "input",
      {
        ref: n,
        onChange: (l) => {
          o == null || o(l), t == null || t(l.target.value);
        },
        className: S(
          "flex-1 h-8 bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-sm placeholder-[color:var(--ds-theme-content-muted)] text-[color:var(--ds-theme-content-default)]",
          e
        ),
        ...r
      }
    )
  ] })
);
dx.displayName = "CommandInput";
function X0({ children: e, className: t }) {
  return /* @__PURE__ */ c("div", { className: S("max-h-[300px] overflow-y-auto p-2 space-y-1", t), children: e });
}
function q0({
  heading: e,
  children: t,
  className: o
}) {
  return /* @__PURE__ */ O("div", { className: S("space-y-1", o), children: [
    /* @__PURE__ */ c("div", { className: "px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[color:var(--ds-theme-content-muted)] uppercase", children: e }),
    /* @__PURE__ */ c("div", { className: "space-y-0.5", children: t })
  ] });
}
const fx = s.forwardRef(
  ({ className: e, onSelect: t, children: o, onClick: r, ...n }, a) => /* @__PURE__ */ c(
    "button",
    {
      ref: a,
      type: "button",
      onClick: (i) => {
        r == null || r(i), t == null || t();
      },
      className: S(
        "w-full text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors text-[color:var(--ds-theme-content-default)] hover:bg-[color:var(--ds-theme-surface-subdued)] flex items-center justify-between",
        e
      ),
      ...n,
      children: o
    }
  )
);
fx.displayName = "CommandItem";
function px({
  className: e,
  ...t
}) {
  return /* @__PURE__ */ c(
    "span",
    {
      className: S(
        "ml-auto text-[10px] font-semibold text-[color:var(--ds-theme-content-muted)] tracking-widest px-1.5 py-0.5 border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/40 rounded",
        e
      ),
      ...t
    }
  );
}
px.displayName = "CommandShortcut";
const vx = s.forwardRef(
  ({ className: e, collapsible: t = !1, isCollapsed: o = !1, children: r, ...n }, a) => /* @__PURE__ */ c(
    "aside",
    {
      ref: a,
      className: S(
        "flex flex-col h-full bg-[color:var(--ds-theme-surface-default)] border-r border-[color:var(--ds-theme-border-subtle)] transition-all duration-300 ease-in-out select-none",
        o ? "w-16" : "w-64",
        e
      ),
      ...n,
      children: r
    }
  )
);
vx.displayName = "Sidebar";
function Z0({ className: e, ...t }) {
  return /* @__PURE__ */ c(
    "div",
    {
      className: S("flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4", e),
      ...t
    }
  );
}
function Q0({ className: e, ...t }) {
  return /* @__PURE__ */ c("div", { className: S("space-y-1.5", e), ...t });
}
function J0({
  className: e,
  isCollapsed: t = !1,
  ...o
}) {
  return t ? null : /* @__PURE__ */ c(
    "div",
    {
      className: S(
        "px-3 py-1.5 text-[10px] font-bold tracking-wider text-[color:var(--ds-theme-content-muted)] uppercase",
        e
      ),
      ...o
    }
  );
}
function eC({ className: e, ...t }) {
  return /* @__PURE__ */ c("div", { className: S("space-y-0.5", e), ...t });
}
function tC({ className: e, ...t }) {
  return /* @__PURE__ */ c("div", { className: S("", e), ...t });
}
const mx = s.forwardRef(
  ({ className: e, isActive: t, isCollapsed: o = !1, children: r, ...n }, a) => /* @__PURE__ */ c(
    "button",
    {
      ref: a,
      type: "button",
      className: S(
        "w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all",
        t ? "bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-default)] font-semibold shadow-[var(--ds-theme-shadow-sm)]" : "text-[color:var(--ds-theme-content-muted)] hover:text-[color:var(--ds-theme-content-default)] hover:bg-[color:var(--ds-theme-surface-subdued)]/50",
        o ? "justify-center px-0 h-9 w-9 mx-auto" : "",
        e
      ),
      ...n,
      children: r
    }
  )
);
mx.displayName = "SidebarMenuButton";
function oC({ className: e, ...t }) {
  return /* @__PURE__ */ c(
    "div",
    {
      className: S(
        "p-3 border-t border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/10",
        e
      ),
      ...t
    }
  );
}
function rC({
  direction: e = "horizontal",
  className: t,
  children: o,
  ...r
}) {
  const [n, a] = s.useState(50), l = s.useRef(null), i = (h) => {
    const g = l.current;
    if (!g) return;
    const m = g.getBoundingClientRect();
    if (e === "horizontal") {
      const w = (h.clientX - m.left) / m.width * 100;
      a(Math.max(10, Math.min(90, w)));
    } else {
      const w = (h.clientY - m.top) / m.height * 100;
      a(Math.max(10, Math.min(90, w)));
    }
  }, u = (h) => {
    h.preventDefault();
    const g = (b) => {
      i(b);
    }, m = () => {
      document.removeEventListener("pointermove", g), document.removeEventListener("pointerup", m);
    };
    document.addEventListener("pointermove", g), document.addEventListener("pointerup", m);
  }, p = s.Children.toArray(o), f = p[0], d = p[1], v = p[2];
  return /* @__PURE__ */ O(
    "div",
    {
      ref: l,
      className: S(
        "flex w-full h-full overflow-hidden border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-xl select-none",
        e === "vertical" ? "flex-col" : "flex-row",
        t
      ),
      ...r,
      children: [
        f && /* @__PURE__ */ c("div", { style: { [e === "horizontal" ? "width" : "height"]: `${String(n)}%` }, children: f }),
        d && /* @__PURE__ */ c("div", { onPointerDown: u, className: "h-full", children: d }),
        v && /* @__PURE__ */ c("div", { className: "flex-1", children: v })
      ]
    }
  );
}
function nC({
  className: e,
  ...t
}) {
  return /* @__PURE__ */ c(
    "div",
    {
      className: S("h-full w-full overflow-auto p-6 bg-[color:var(--ds-theme-surface-default)] text-[color:var(--ds-theme-content-default)]", e),
      ...t
    }
  );
}
function aC({
  className: e,
  ...t
}) {
  return /* @__PURE__ */ c(
    "div",
    {
      className: S(
        "w-1.5 h-full cursor-col-resize hover:bg-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-border-subtle)]/40 transition-colors flex items-center justify-center relative active:bg-[color:var(--ds-theme-content-default)]",
        e
      ),
      ...t
    }
  );
}
var Qt = "Menubar", [Wr, hx, gx] = yt(Qt), [xd] = J(Qt, [
  gx,
  Ae
]), le = An(), Cd = Ae(), [bx, na] = xd(Qt), Sd = s.forwardRef(
  (e, t) => {
    const {
      __scopeMenubar: o,
      value: r,
      onValueChange: n,
      defaultValue: a,
      loop: l = !0,
      dir: i,
      ...u
    } = e, p = Pe(i), f = Cd(o), [d, v] = oe({
      prop: r,
      onChange: n,
      defaultProp: a ?? "",
      caller: Qt
    }), [h, g] = s.useState(null);
    return /* @__PURE__ */ c(
      bx,
      {
        scope: o,
        value: d,
        onMenuOpen: s.useCallback(
          (m) => {
            v(m), g(m);
          },
          [v]
        ),
        onMenuClose: s.useCallback(() => v(""), [v]),
        onMenuToggle: s.useCallback(
          (m) => {
            v((b) => b ? "" : m), g(m);
          },
          [v]
        ),
        dir: p,
        loop: l,
        children: /* @__PURE__ */ c(Wr.Provider, { scope: o, children: /* @__PURE__ */ c(Wr.Slot, { scope: o, children: /* @__PURE__ */ c(
          $t,
          {
            asChild: !0,
            ...f,
            orientation: "horizontal",
            loop: l,
            dir: p,
            currentTabStopId: h,
            onCurrentTabStopIdChange: g,
            children: /* @__PURE__ */ c(M.div, { role: "menubar", ...u, ref: t })
          }
        ) }) })
      }
    );
  }
);
Sd.displayName = Qt;
var aa = "MenubarMenu", [yx, Rd] = xd(aa), Nd = (e) => {
  const { __scopeMenubar: t, value: o, ...r } = e, n = ne(), a = o || n || "LEGACY_REACT_AUTO_VALUE", l = na(aa, t), i = le(t), u = s.useRef(null), p = s.useRef(!1), f = l.value === a;
  return s.useEffect(() => {
    f || (p.current = !1);
  }, [f]), /* @__PURE__ */ c(
    yx,
    {
      scope: t,
      value: a,
      triggerId: ne(),
      triggerRef: u,
      contentId: ne(),
      wasKeyboardTriggerOpenRef: p,
      children: /* @__PURE__ */ c(
        Vi,
        {
          ...i,
          open: f,
          onOpenChange: (d) => {
            d || l.onMenuClose();
          },
          modal: !1,
          dir: l.dir,
          ...r
        }
      )
    }
  );
};
Nd.displayName = aa;
var Gr = "MenubarTrigger", Ed = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, disabled: r = !1, ...n } = e, a = Cd(o), l = le(o), i = na(Gr, o), u = Rd(Gr, o), p = s.useRef(null), f = L(t, p, u.triggerRef), [d, v] = s.useState(!1), h = i.value === u.value;
    return /* @__PURE__ */ c(Wr.ItemSlot, { scope: o, value: u.value, disabled: r, children: /* @__PURE__ */ c(
      zt,
      {
        asChild: !0,
        ...a,
        focusable: !r,
        tabStopId: u.value,
        children: /* @__PURE__ */ c(Ui, { asChild: !0, ...l, children: /* @__PURE__ */ c(
          M.button,
          {
            type: "button",
            role: "menuitem",
            id: u.triggerId,
            "aria-haspopup": "menu",
            "aria-expanded": h,
            "aria-controls": h ? u.contentId : void 0,
            "data-highlighted": d ? "" : void 0,
            "data-state": h ? "open" : "closed",
            "data-disabled": r ? "" : void 0,
            disabled: r,
            ...n,
            ref: f,
            onPointerDown: N(e.onPointerDown, (g) => {
              !r && g.button === 0 && g.ctrlKey === !1 && (i.onMenuOpen(u.value), h || g.preventDefault());
            }),
            onPointerEnter: N(e.onPointerEnter, () => {
              var m;
              !!i.value && !h && (i.onMenuOpen(u.value), (m = p.current) == null || m.focus());
            }),
            onKeyDown: N(e.onKeyDown, (g) => {
              r || (["Enter", " "].includes(g.key) && i.onMenuToggle(u.value), g.key === "ArrowDown" && i.onMenuOpen(u.value), ["Enter", " ", "ArrowDown"].includes(g.key) && (u.wasKeyboardTriggerOpenRef.current = !0, g.preventDefault()));
            }),
            onFocus: N(e.onFocus, () => v(!0)),
            onBlur: N(e.onBlur, () => v(!1))
          }
        ) })
      }
    ) });
  }
);
Ed.displayName = Gr;
var wx = "MenubarPortal", Pd = (e) => {
  const { __scopeMenubar: t, ...o } = e, r = le(t);
  return /* @__PURE__ */ c(Ki, { ...r, ...o });
};
Pd.displayName = wx;
var Vr = "MenubarContent", Ad = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, align: r = "start", ...n } = e, a = le(o), l = na(Vr, o), i = Rd(Vr, o), u = hx(o), p = s.useRef(!1);
    return /* @__PURE__ */ c(
      ji,
      {
        id: i.contentId,
        "aria-labelledby": i.triggerId,
        "data-radix-menubar-content": "",
        ...a,
        ...n,
        ref: t,
        align: r,
        onCloseAutoFocus: N(e.onCloseAutoFocus, (f) => {
          var v;
          !!!l.value && !p.current && ((v = i.triggerRef.current) == null || v.focus()), p.current = !1, f.preventDefault();
        }),
        onFocusOutside: N(e.onFocusOutside, (f) => {
          const d = f.target;
          u().some((h) => {
            var g;
            return (g = h.ref.current) == null ? void 0 : g.contains(d);
          }) && f.preventDefault();
        }),
        onInteractOutside: N(e.onInteractOutside, () => {
          p.current = !0;
        }),
        onEntryFocus: (f) => {
          i.wasKeyboardTriggerOpenRef.current || f.preventDefault();
        },
        onKeyDown: N(
          e.onKeyDown,
          (f) => {
            if (["ArrowRight", "ArrowLeft"].includes(f.key)) {
              const d = f.target, v = d.hasAttribute("data-radix-menubar-subtrigger"), h = d.closest("[data-radix-menubar-content]") !== f.currentTarget, m = (l.dir === "rtl" ? "ArrowRight" : "ArrowLeft") === f.key;
              if (!m && v || h && m) return;
              let y = u().filter((R) => !R.disabled).map((R) => R.value);
              m && y.reverse();
              const x = y.indexOf(i.value);
              y = l.loop ? zx(y, x + 1) : y.slice(x + 1);
              const [C] = y;
              C && l.onMenuOpen(C);
            }
          },
          { checkForDefaultPrevented: !1 }
        ),
        style: {
          ...e.style,
          "--radix-menubar-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-menubar-content-available-width": "var(--radix-popper-available-width)",
          "--radix-menubar-content-available-height": "var(--radix-popper-available-height)",
          "--radix-menubar-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-menubar-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }
);
Ad.displayName = Vr;
var xx = "MenubarGroup", _d = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(Yi, { ...n, ...r, ref: t });
  }
);
_d.displayName = xx;
var Cx = "MenubarLabel", Sx = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(Xi, { ...n, ...r, ref: t });
  }
);
Sx.displayName = Cx;
var Rx = "MenubarItem", Td = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(qi, { ...n, ...r, ref: t });
  }
);
Td.displayName = Rx;
var Nx = "MenubarCheckboxItem", Ex = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(Zi, { ...n, ...r, ref: t });
  }
);
Ex.displayName = Nx;
var Px = "MenubarRadioGroup", Md = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(Qi, { ...n, ...r, ref: t });
  }
);
Md.displayName = Px;
var Ax = "MenubarRadioItem", _x = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(Ji, { ...n, ...r, ref: t });
  }
);
_x.displayName = Ax;
var Tx = "MenubarItemIndicator", Mx = s.forwardRef((e, t) => {
  const { __scopeMenubar: o, ...r } = e, n = le(o);
  return /* @__PURE__ */ c(ec, { ...n, ...r, ref: t });
});
Mx.displayName = Tx;
var Ix = "MenubarSeparator", Id = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(tc, { ...n, ...r, ref: t });
  }
);
Id.displayName = Ix;
var Dx = "MenubarArrow", kx = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(oc, { ...n, ...r, ref: t });
  }
);
kx.displayName = Dx;
var Dd = "MenubarSub", kd = (e) => {
  const { __scopeMenubar: t, children: o, open: r, onOpenChange: n, defaultOpen: a } = e, l = le(t), [i, u] = oe({
    prop: r,
    defaultProp: a ?? !1,
    onChange: n,
    caller: Dd
  });
  return /* @__PURE__ */ c(rc, { ...l, open: i, onOpenChange: u, children: o });
};
kd.displayName = Dd;
var Ox = "MenubarSubTrigger", Fx = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(
      nc,
      {
        "data-radix-menubar-subtrigger": "",
        ...n,
        ...r,
        ref: t
      }
    );
  }
);
Fx.displayName = Ox;
var Lx = "MenubarSubContent", $x = s.forwardRef(
  (e, t) => {
    const { __scopeMenubar: o, ...r } = e, n = le(o);
    return /* @__PURE__ */ c(
      ac,
      {
        ...n,
        "data-radix-menubar-content": "",
        ...r,
        ref: t,
        style: {
          ...e.style,
          "--radix-menubar-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-menubar-content-available-width": "var(--radix-popper-available-width)",
          "--radix-menubar-content-available-height": "var(--radix-popper-available-height)",
          "--radix-menubar-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-menubar-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }
);
$x.displayName = Lx;
function zx(e, t) {
  return e.map((o, r) => e[(t + r) % e.length]);
}
var Od = Sd, Bx = Nd, Fd = Ed, Ld = Pd, $d = Ad, Hx = _d, zd = Td, Wx = Md, Bd = Id, Gx = kd;
const sC = Bx, lC = Hx, iC = Ld, cC = Gx, uC = Wx, Vx = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Od,
  {
    ref: o,
    className: S(
      "flex h-10 items-center space-x-1 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-1 shadow-[var(--ds-theme-shadow-sm)]",
      e
    ),
    ...t
  }
));
Vx.displayName = Od.displayName;
const Ux = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Fd,
  {
    ref: o,
    className: S(
      "flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:bg-[color:var(--ds-theme-surface-subdued)] focus:text-[color:var(--ds-theme-content-default)] data-[state=open]:bg-[color:var(--ds-theme-surface-subdued)] data-[state=open]:text-[color:var(--ds-theme-content-default)] transition-colors",
      e
    ),
    ...t
  }
));
Ux.displayName = Fd.displayName;
const Kx = s.forwardRef(({ className: e, align: t = "start", alignOffset: o = -4, sideOffset: r = 8, ...n }, a) => /* @__PURE__ */ c(Ld, { children: /* @__PURE__ */ c(
  $d,
  {
    ref: a,
    align: t,
    alignOffset: o,
    sideOffset: r,
    className: S(
      "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-1 text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] animate-in fade-in-80 slide-in-from-top-1 duration-150",
      e
    ),
    ...n
  }
) }));
Kx.displayName = $d.displayName;
const jx = s.forwardRef(({ className: e, inset: t, ...o }, r) => /* @__PURE__ */ c(
  zd,
  {
    ref: r,
    className: S(
      "relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-xs outline-none focus:bg-[color:var(--ds-theme-surface-subdued)] focus:text-[color:var(--ds-theme-content-default)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40 transition-colors",
      t && "pl-8",
      e
    ),
    ...o
  }
));
jx.displayName = zd.displayName;
const Yx = s.forwardRef(({ className: e, ...t }, o) => /* @__PURE__ */ c(
  Bd,
  {
    ref: o,
    className: S("my-1 h-[1px] bg-[color:var(--ds-theme-border-subtle)]", e),
    ...t
  }
));
Yx.displayName = Bd.displayName;
const Xx = ({
  className: e,
  ...t
}) => /* @__PURE__ */ c(
  "span",
  {
    className: S(
      "ml-auto text-[10px] tracking-widest text-[color:var(--ds-theme-content-muted)]",
      e
    ),
    ...t
  }
);
Xx.displayName = "MenubarShortcut";
const qx = { _comment: "Primitive color scales. Never reference these directly in components — always use semantic tokens. Each scale runs 50 (lightest) → 950 (darkest).", neutral: { 0: { value: "#FFFFFF", type: "color" }, 50: { value: "#FAFAFA", type: "color" }, 100: { value: "#F4F4F5", type: "color" }, 200: { value: "#E8E8EC", type: "color" }, 300: { value: "#D4D4DA", type: "color" }, 400: { value: "#A1A1AA", type: "color" }, 500: { value: "#71717A", type: "color" }, 600: { value: "#52525B", type: "color" }, 700: { value: "#3F3F46", type: "color" }, 800: { value: "#27272A", type: "color" }, 900: { value: "#18181B", type: "color" }, 950: { value: "#09090B", type: "color" }, 1e3: { value: "#000000", type: "color" } }, lavender: { 50: { value: "#F5F3FF", type: "color" }, 100: { value: "#EDE9FE", type: "color" }, 200: { value: "#DDD6FE", type: "color" }, 300: { value: "#C4B5FD", type: "color" }, 400: { value: "#A78BFA", type: "color" }, 500: { value: "#8B5CF6", type: "color" }, 600: { value: "#7C3AED", type: "color" }, 700: { value: "#6D28D9", type: "color" }, 800: { value: "#5B21B6", type: "color" }, 900: { value: "#4C1D95", type: "color" }, 950: { value: "#2E1065", type: "color" }, _comment: "Primary family — inspired by the dashboard purples in references." }, blush: { 50: { value: "#FFF1F5", type: "color" }, 100: { value: "#FFE4EC", type: "color" }, 200: { value: "#FFCCDA", type: "color" }, 300: { value: "#FBA3BD", type: "color" }, 400: { value: "#F472A0", type: "color" }, 500: { value: "#EC4899", type: "color" }, 600: { value: "#DB2777", type: "color" }, 700: { value: "#BE185D", type: "color" }, 800: { value: "#9D174D", type: "color" }, 900: { value: "#831843", type: "color" }, 950: { value: "#500724", type: "color" }, _comment: "Accent family — the soft pinks from the references." }, sage: { 50: { value: "#F0FDF4", type: "color" }, 100: { value: "#DCFCE7", type: "color" }, 200: { value: "#BBF7D0", type: "color" }, 300: { value: "#86EFAC", type: "color" }, 400: { value: "#4ADE80", type: "color" }, 500: { value: "#22C55E", type: "color" }, 600: { value: "#16A34A", type: "color" }, 700: { value: "#15803D", type: "color" }, 800: { value: "#166534", type: "color" }, 900: { value: "#14532D", type: "color" }, 950: { value: "#052E16", type: "color" }, _comment: "Success / nature family." }, amber: { 50: { value: "#FFFBEB", type: "color" }, 100: { value: "#FEF3C7", type: "color" }, 200: { value: "#FDE68A", type: "color" }, 300: { value: "#FCD34D", type: "color" }, 400: { value: "#FBBF24", type: "color" }, 500: { value: "#F59E0B", type: "color" }, 600: { value: "#D97706", type: "color" }, 700: { value: "#B45309", type: "color" }, 800: { value: "#92400E", type: "color" }, 900: { value: "#78350F", type: "color" }, 950: { value: "#451A03", type: "color" }, _comment: "Warning family." }, coral: { 50: { value: "#FEF2F2", type: "color" }, 100: { value: "#FEE2E2", type: "color" }, 200: { value: "#FECACA", type: "color" }, 300: { value: "#FCA5A5", type: "color" }, 400: { value: "#F87171", type: "color" }, 500: { value: "#EF4444", type: "color" }, 600: { value: "#DC2626", type: "color" }, 700: { value: "#B91C1C", type: "color" }, 800: { value: "#991B1B", type: "color" }, 900: { value: "#7F1D1D", type: "color" }, 950: { value: "#450A0A", type: "color" }, _comment: "Danger / destructive family." }, ocean: { 50: { value: "#EFF6FF", type: "color" }, 100: { value: "#DBEAFE", type: "color" }, 200: { value: "#BFDBFE", type: "color" }, 300: { value: "#93C5FD", type: "color" }, 400: { value: "#60A5FA", type: "color" }, 500: { value: "#3B82F6", type: "color" }, 600: { value: "#2563EB", type: "color" }, 700: { value: "#1D4ED8", type: "color" }, 800: { value: "#1E40AF", type: "color" }, 900: { value: "#1E3A8A", type: "color" }, 950: { value: "#172554", type: "color" }, _comment: "Info family — calmer alternative to lavender." } }, Zx = {
  color: qx
}, Qx = { 0: { value: "0px", type: "spacing" }, 1: { value: "4px", type: "spacing" }, 2: { value: "8px", type: "spacing" }, 3: { value: "12px", type: "spacing" }, 4: { value: "16px", type: "spacing" }, 5: { value: "20px", type: "spacing" }, 6: { value: "24px", type: "spacing" }, 7: { value: "28px", type: "spacing" }, 8: { value: "32px", type: "spacing" }, 10: { value: "40px", type: "spacing" }, 12: { value: "48px", type: "spacing" }, 14: { value: "56px", type: "spacing" }, 16: { value: "64px", type: "spacing" }, 20: { value: "80px", type: "spacing" }, 24: { value: "96px", type: "spacing" }, 32: { value: "128px", type: "spacing" }, 40: { value: "160px", type: "spacing" }, 48: { value: "192px", type: "spacing" }, 56: { value: "224px", type: "spacing" }, 64: { value: "256px", type: "spacing" }, _comment: "Base-4 spacing scale. Use these in layouts via semantic tokens (space.gutter, space.section, etc).", px: { value: "1px", type: "spacing" }, half: { value: "2px", type: "spacing" }, "1half": { value: "6px", type: "spacing" }, "2half": { value: "10px", type: "spacing" } }, Jx = { _comment: "Radius scale tuned for the rounded/pill aesthetic in references. 'pill' = fully rounded.", none: { value: "0px", type: "borderRadius" }, xs: { value: "4px", type: "borderRadius" }, sm: { value: "8px", type: "borderRadius" }, md: { value: "12px", type: "borderRadius" }, lg: { value: "16px", type: "borderRadius" }, xl: { value: "20px", type: "borderRadius" }, "2xl": { value: "24px", type: "borderRadius" }, "3xl": { value: "32px", type: "borderRadius" }, "4xl": { value: "40px", type: "borderRadius" }, pill: { value: "9999px", type: "borderRadius" } }, e0 = { width: { 0: { value: "0px", type: "borderWidth" }, 1: { value: "1px", type: "borderWidth" }, 2: { value: "2px", type: "borderWidth" }, 3: { value: "3px", type: "borderWidth" }, 4: { value: "4px", type: "borderWidth" }, hairline: { value: "0.5px", type: "borderWidth" }, "1half": { value: "1.5px", type: "borderWidth" } } }, t0 = { _comment: "Component sizes — buttons, inputs, avatars, icons.", control: { xs: { value: "24px", type: "sizing" }, sm: { value: "32px", type: "sizing" }, md: { value: "40px", type: "sizing" }, lg: { value: "48px", type: "sizing" }, xl: { value: "56px", type: "sizing" } }, icon: { xs: { value: "12px", type: "sizing" }, sm: { value: "16px", type: "sizing" }, md: { value: "20px", type: "sizing" }, lg: { value: "24px", type: "sizing" }, xl: { value: "32px", type: "sizing" }, "2xl": { value: "40px", type: "sizing" } }, avatar: { xs: { value: "20px", type: "sizing" }, sm: { value: "28px", type: "sizing" }, md: { value: "36px", type: "sizing" }, lg: { value: "48px", type: "sizing" }, xl: { value: "64px", type: "sizing" }, "2xl": { value: "96px", type: "sizing" } } }, o0 = { _comment: "Mobile-first breakpoints. tv covers embedded/10ft viewing.", xs: { value: "360px", type: "sizing" }, sm: { value: "640px", type: "sizing" }, md: { value: "768px", type: "sizing" }, lg: { value: "1024px", type: "sizing" }, xl: { value: "1280px", type: "sizing" }, "2xl": { value: "1536px", type: "sizing" }, tv: { value: "1920px", type: "sizing" } }, r0 = { hide: { value: "-1", type: "other" }, base: { value: "0", type: "other" }, raised: { value: "10", type: "other" }, dropdown: { value: "100", type: "other" }, sticky: { value: "200", type: "other" }, overlay: { value: "300", type: "other" }, modal: { value: "400", type: "other" }, popover: { value: "500", type: "other" }, toast: { value: "600", type: "other" }, tooltip: { value: "700", type: "other" } }, ct = {
  spacing: Qx,
  radius: Jx,
  border: e0,
  size: t0,
  breakpoint: o0,
  zIndex: r0
}, n0 = { duration: { _comment: "Animation timings. 'instant' for state toggles, 'slow' for hero entrances.", instant: { value: "50ms", type: "duration" }, fast: { value: "150ms", type: "duration" }, moderate: { value: "250ms", type: "duration" }, slow: { value: "400ms", type: "duration" }, slower: { value: "600ms", type: "duration" }, slowest: { value: "1000ms", type: "duration" } }, easing: { _comment: "Bezier curves. 'snap' is the default snappy UI easing.", linear: { value: "linear", type: "cubicBezier" }, snap: { value: "cubic-bezier(0.32, 0.72, 0, 1)", type: "cubicBezier" }, smooth: { value: "cubic-bezier(0.4, 0, 0.2, 1)", type: "cubicBezier" }, decelerate: { value: "cubic-bezier(0, 0, 0.2, 1)", type: "cubicBezier" }, accelerate: { value: "cubic-bezier(0.4, 0, 1, 1)", type: "cubicBezier" }, spring: { value: "cubic-bezier(0.5, 1.5, 0.5, 1)", type: "cubicBezier" }, anticipate: { value: "cubic-bezier(0.68, -0.55, 0.27, 1.55)", type: "cubicBezier" } }, preset: { _comment: "Common motion combos. Use these in CSS transitions.", hover: { value: "150ms cubic-bezier(0.4, 0, 0.2, 1)", type: "other" }, press: { value: "50ms  cubic-bezier(0.4, 0, 1, 1)", type: "other" }, enter: { value: "250ms cubic-bezier(0, 0, 0.2, 1)", type: "other" }, exit: { value: "150ms cubic-bezier(0.4, 0, 1, 1)", type: "other" }, modal: { value: "400ms cubic-bezier(0.32, 0.72, 0, 1)", type: "other" }, page: { value: "400ms cubic-bezier(0.32, 0.72, 0, 1)", type: "other" } } }, a0 = {
  motion: n0
}, s0 = { family: { _comment: "Default stack uses distinctive geometric/humanist fonts. White-label clients can override via theme.", display: { value: "'General Sans', 'Inter Display', system-ui, -apple-system, sans-serif", type: "fontFamilies", description: "Headlines, hero text, large numerals" }, sans: { value: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", type: "fontFamilies", description: "Default UI text" }, serif: { value: "'Fraunces', 'Source Serif Pro', Georgia, serif", type: "fontFamilies", description: "Editorial moments, long-form reading" }, mono: { value: "'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, monospace", type: "fontFamilies", description: "Code, IDs, tabular numerics" } }, weight: { thin: { value: "100", type: "fontWeights" }, extralight: { value: "200", type: "fontWeights" }, light: { value: "300", type: "fontWeights" }, regular: { value: "400", type: "fontWeights" }, medium: { value: "500", type: "fontWeights" }, semibold: { value: "600", type: "fontWeights" }, bold: { value: "700", type: "fontWeights" }, extrabold: { value: "800", type: "fontWeights" }, black: { value: "900", type: "fontWeights" } }, size: { _comment: "Modular scale ~1.2 ratio. Use rem so user OS settings work.", "2xs": { value: "0.625rem", type: "fontSizes" }, xs: { value: "0.75rem", type: "fontSizes" }, sm: { value: "0.875rem", type: "fontSizes" }, md: { value: "1rem", type: "fontSizes" }, lg: { value: "1.125rem", type: "fontSizes" }, xl: { value: "1.25rem", type: "fontSizes" }, "2xl": { value: "1.5rem", type: "fontSizes" }, "3xl": { value: "1.875rem", type: "fontSizes" }, "4xl": { value: "2.25rem", type: "fontSizes" }, "5xl": { value: "3rem", type: "fontSizes" }, "6xl": { value: "3.75rem", type: "fontSizes" }, "7xl": { value: "4.5rem", type: "fontSizes" }, "8xl": { value: "6rem", type: "fontSizes" } }, lineHeight: { none: { value: "1", type: "lineHeights" }, tight: { value: "1.1", type: "lineHeights" }, snug: { value: "1.25", type: "lineHeights" }, normal: { value: "1.5", type: "lineHeights" }, relaxed: { value: "1.625", type: "lineHeights" }, loose: { value: "2", type: "lineHeights" } }, letterSpacing: { tighter: { value: "-0.04em", type: "letterSpacing" }, tight: { value: "-0.02em", type: "letterSpacing" }, normal: { value: "0", type: "letterSpacing" }, wide: { value: "0.02em", type: "letterSpacing" }, wider: { value: "0.04em", type: "letterSpacing" }, widest: { value: "0.08em", type: "letterSpacing" } } }, l0 = { _comment: "Composed text styles — what designers/devs actually use. Reference these, not individual font tokens.", displayXl: { value: { fontFamily: "{font.family.display.value}", fontSize: "{font.size.7xl.value}", fontWeight: "{font.weight.bold.value}", lineHeight: "{font.lineHeight.tight.value}", letterSpacing: "{font.letterSpacing.tighter.value}" }, type: "typography" }, displayLg: { value: { fontFamily: "{font.family.display.value}", fontSize: "{font.size.5xl.value}", fontWeight: "{font.weight.bold.value}", lineHeight: "{font.lineHeight.tight.value}", letterSpacing: "{font.letterSpacing.tight.value}" }, type: "typography" }, displayMd: { value: { fontFamily: "{font.family.display.value}", fontSize: "{font.size.4xl.value}", fontWeight: "{font.weight.semibold.value}", lineHeight: "{font.lineHeight.tight.value}", letterSpacing: "{font.letterSpacing.tight.value}" }, type: "typography" }, headingXl: { value: { fontFamily: "{font.family.display.value}", fontSize: "{font.size.3xl.value}", fontWeight: "{font.weight.semibold.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.tight.value}" }, type: "typography" }, headingLg: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.2xl.value}", fontWeight: "{font.weight.semibold.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.tight.value}" }, type: "typography" }, headingMd: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.xl.value}", fontWeight: "{font.weight.semibold.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" }, headingSm: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.lg.value}", fontWeight: "{font.weight.semibold.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" }, bodyLg: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.lg.value}", fontWeight: "{font.weight.regular.value}", lineHeight: "{font.lineHeight.relaxed.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" }, bodyMd: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.md.value}", fontWeight: "{font.weight.regular.value}", lineHeight: "{font.lineHeight.normal.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" }, bodySm: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.sm.value}", fontWeight: "{font.weight.regular.value}", lineHeight: "{font.lineHeight.normal.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" }, label: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.sm.value}", fontWeight: "{font.weight.medium.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" }, caption: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.xs.value}", fontWeight: "{font.weight.medium.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.wide.value}" }, type: "typography" }, overline: { value: { fontFamily: "{font.family.sans.value}", fontSize: "{font.size.xs.value}", fontWeight: "{font.weight.semibold.value}", lineHeight: "{font.lineHeight.snug.value}", letterSpacing: "{font.letterSpacing.widest.value}", textTransform: "uppercase" }, type: "typography" }, code: { value: { fontFamily: "{font.family.mono.value}", fontSize: "{font.size.sm.value}", fontWeight: "{font.weight.regular.value}", lineHeight: "{font.lineHeight.normal.value}", letterSpacing: "{font.letterSpacing.normal.value}" }, type: "typography" } }, Wa = {
  font: s0,
  textStyle: l0
}, i0 = /* @__PURE__ */ JSON.parse('{"_comment":"Component-level tokens. Components ONLY reference these — never primitives or theme tokens directly. This is the stable contract.","button":{"radius":{"value":"{radius.pill.value}","type":"borderRadius"},"fontWeight":{"value":"{font.weight.semibold.value}","type":"fontWeights"},"height":{"sm":{"value":"{size.control.sm.value}","type":"sizing"},"md":{"value":"{size.control.md.value}","type":"sizing"},"lg":{"value":"{size.control.lg.value}","type":"sizing"}},"paddingX":{"sm":{"value":"{spacing.3.value}","type":"spacing"},"md":{"value":"{spacing.4.value}","type":"spacing"},"lg":{"value":"{spacing.6.value}","type":"spacing"}},"gap":{"value":"{spacing.2.value}","type":"spacing"},"primary":{"bg":{"value":"{theme.intent.primary.fill.value}","type":"color"},"bgHover":{"value":"{theme.intent.primary.fillHover.value}","type":"color"},"text":{"value":"{theme.intent.primary.onFill.value}","type":"color"}},"secondary":{"bg":{"value":"{theme.surface.default.value}","type":"color"},"bgHover":{"value":"{theme.surface.subdued.value}","type":"color"},"text":{"value":"{theme.content.strong.value}","type":"color"},"border":{"value":"{theme.border.default.value}","type":"color"}},"ghost":{"bg":{"value":"transparent","type":"color"},"bgHover":{"value":"{theme.surface.subdued.value}","type":"color"},"text":{"value":"{theme.content.strong.value}","type":"color"}},"danger":{"bg":{"value":"{theme.intent.danger.fill.value}","type":"color"},"bgHover":{"value":"{theme.intent.danger.fillHover.value}","type":"color"},"text":{"value":"{theme.intent.danger.onFill.value}","type":"color"}}},"input":{"radius":{"value":"{radius.lg.value}","type":"borderRadius"},"height":{"sm":{"value":"{size.control.sm.value}","type":"sizing"},"md":{"value":"{size.control.md.value}","type":"sizing"},"lg":{"value":"{size.control.lg.value}","type":"sizing"}},"paddingX":{"value":"{spacing.4.value}","type":"spacing"},"bg":{"value":"{theme.surface.default.value}","type":"color"},"bgDisabled":{"value":"{theme.surface.subdued.value}","type":"color"},"text":{"value":"{theme.content.strong.value}","type":"color"},"placeholder":{"value":"{theme.content.subtle.value}","type":"color"},"border":{"value":"{theme.border.default.value}","type":"color"},"borderHover":{"value":"{theme.border.strong.value}","type":"color"},"borderFocus":{"value":"{theme.border.focus.value}","type":"color"},"borderError":{"value":"{theme.intent.danger.border.value}","type":"color"},"shadowFocus":{"value":"{theme.shadow.focus.value}","type":"boxShadow"}},"card":{"radius":{"value":"{radius.2xl.value}","type":"borderRadius"},"padding":{"_comment":"Sized to match Card.metadata.ts variants.padding (none/sm/md/lg).","none":{"value":"{spacing.0.value}","type":"spacing"},"sm":{"value":"{spacing.3.value}","type":"spacing"},"md":{"value":"{spacing.6.value}","type":"spacing"},"lg":{"value":"{spacing.8.value}","type":"spacing"}},"bg":{"value":"{theme.surface.raised.value}","type":"color"},"border":{"value":"{theme.border.subtle.value}","type":"color"},"shadow":{"value":"{theme.shadow.sm.value}","type":"boxShadow"},"shadowHover":{"value":"{theme.shadow.md.value}","type":"boxShadow"}},"modal":{"radius":{"value":"{radius.3xl.value}","type":"borderRadius"},"padding":{"value":"{spacing.8.value}","type":"spacing"},"bg":{"value":"{theme.surface.overlay.value}","type":"color"},"shadow":{"value":"{theme.shadow.2xl.value}","type":"boxShadow"},"scrim":{"value":"{theme.surface.scrim.value}","type":"color"},"width":{"sm":{"value":"384px","type":"sizing"},"md":{"value":"512px","type":"sizing"},"lg":{"value":"720px","type":"sizing"}}},"popover":{"radius":{"value":"{radius.xl.value}","type":"borderRadius"},"padding":{"value":"{spacing.3.value}","type":"spacing"},"bg":{"value":"{theme.surface.floating.value}","type":"color"},"border":{"value":"{theme.border.subtle.value}","type":"color"},"shadow":{"value":"{theme.shadow.lg.value}","type":"boxShadow"}},"tooltip":{"radius":{"value":"{radius.md.value}","type":"borderRadius"},"paddingX":{"value":"{spacing.2.value}","type":"spacing"},"paddingY":{"value":"{spacing.1.value}","type":"spacing"},"bg":{"value":"{theme.surface.inverse.value}","type":"color"},"text":{"value":"{theme.content.onInverse.value}","type":"color"}},"tab":{"radius":{"value":"{radius.pill.value}","type":"borderRadius"},"paddingX":{"value":"{spacing.4.value}","type":"spacing"},"paddingY":{"value":"{spacing.2.value}","type":"spacing"},"bgActive":{"value":"{theme.intent.primary.fill.value}","type":"color"},"textActive":{"value":"{theme.intent.primary.onFill.value}","type":"color"},"bgInactive":{"value":"transparent","type":"color"},"textInactive":{"value":"{theme.content.muted.value}","type":"color"},"bgHover":{"value":"{theme.surface.subdued.value}","type":"color"}},"badge":{"radius":{"value":"{radius.pill.value}","type":"borderRadius"},"paddingX":{"value":"{spacing.2.value}","type":"spacing"},"paddingY":{"value":"{spacing.half.value}","type":"spacing"},"fontSize":{"value":"{font.size.xs.value}","type":"fontSizes"},"fontWeight":{"value":"{font.weight.semibold.value}","type":"fontWeights"},"neutral":{"bg":{"value":"{theme.surface.subdued.value}","type":"color"},"text":{"value":"{theme.content.strong.value}","type":"color"}},"success":{"bg":{"value":"{theme.intent.success.subtle.value}","type":"color"},"text":{"value":"{theme.intent.success.onSubtle.value}","type":"color"}},"warning":{"bg":{"value":"{theme.intent.warning.subtle.value}","type":"color"},"text":{"value":"{theme.intent.warning.onSubtle.value}","type":"color"}},"danger":{"bg":{"value":"{theme.intent.danger.subtle.value}","type":"color"},"text":{"value":"{theme.intent.danger.onSubtle.value}","type":"color"}},"info":{"bg":{"value":"{theme.intent.info.subtle.value}","type":"color"},"text":{"value":"{theme.intent.info.onSubtle.value}","type":"color"}}},"checkbox":{"radius":{"value":"{radius.sm.value}","type":"borderRadius"},"size":{"value":"{spacing.5.value}","type":"sizing"},"bgChecked":{"value":"{theme.intent.primary.fill.value}","type":"color"},"iconChecked":{"value":"{theme.intent.primary.onFill.value}","type":"color"},"border":{"value":"{theme.border.strong.value}","type":"color"}},"switch":{"track":{"width":{"value":"44px","type":"sizing"},"height":{"value":"24px","type":"sizing"},"radius":{"value":"{radius.pill.value}","type":"borderRadius"},"bgOff":{"value":"{theme.border.default.value}","type":"color"},"bgOn":{"value":"{theme.intent.primary.fill.value}","type":"color"}},"thumb":{"size":{"value":"20px","type":"sizing"},"bg":{"value":"{theme.surface.default.value}","type":"color"},"shadow":{"value":"{theme.shadow.sm.value}","type":"boxShadow"}}},"navigation":{"_comment":"Side rails and top navs from the references.","sidebar":{"width":{"value":"240px","type":"sizing"},"widthCollapsed":{"value":"64px","type":"sizing"},"bg":{"value":"{theme.surface.canvas.value}","type":"color"},"bgInverse":{"value":"{theme.surface.inverse.value}","type":"color"}},"item":{"radius":{"value":"{radius.lg.value}","type":"borderRadius"},"height":{"value":"{size.control.md.value}","type":"sizing"},"paddingX":{"value":"{spacing.3.value}","type":"spacing"},"gap":{"value":"{spacing.3.value}","type":"spacing"},"bgActive":{"value":"{theme.intent.primary.fill.value}","type":"color"},"textActive":{"value":"{theme.intent.primary.onFill.value}","type":"color"},"bgHover":{"value":"{theme.surface.subdued.value}","type":"color"},"textInactive":{"value":"{theme.content.muted.value}","type":"color"}}},"message":{"_comment":"Chat bubbles from the messaging references.","radius":{"value":"{radius.2xl.value}","type":"borderRadius"},"paddingX":{"value":"{spacing.4.value}","type":"spacing"},"paddingY":{"value":"{spacing.3.value}","type":"spacing"},"bgSent":{"value":"{theme.intent.primary.fill.value}","type":"color"},"textSent":{"value":"{theme.intent.primary.onFill.value}","type":"color"},"bgReceived":{"value":"{theme.surface.subdued.value}","type":"color"},"textReceived":{"value":"{theme.content.strong.value}","type":"color"}},"avatar":{"radius":{"value":"{radius.pill.value}","type":"borderRadius"},"ringWidth":{"value":"{border.width.2.value}","type":"borderWidth"},"ringColor":{"value":"{theme.surface.default.value}","type":"color"},"size":{"xs":{"value":"{size.avatar.xs.value}","type":"sizing"},"sm":{"value":"{size.avatar.sm.value}","type":"sizing"},"md":{"value":"{size.avatar.md.value}","type":"sizing"},"lg":{"value":"{size.avatar.lg.value}","type":"sizing"},"xl":{"value":"{size.avatar.xl.value}","type":"sizing"},"2xl":{"value":"{size.avatar.2xl.value}","type":"sizing"}},"fallback":{"bg":{"value":"{theme.intent.primary.subtle.value}","type":"color"},"text":{"value":"{theme.intent.primary.onSubtle.value}","type":"color"}}},"alert":{"_comment":"Inline persistent status message.","radius":{"value":"{radius.xl.value}","type":"borderRadius"},"paddingX":{"value":"{spacing.4.value}","type":"spacing"},"paddingY":{"value":"{spacing.3.value}","type":"spacing"},"gap":{"value":"{spacing.3.value}","type":"spacing"},"borderWidth":{"value":"{border.width.1.value}","type":"borderWidth"},"info":{"bg":{"value":"{theme.intent.info.subtle.value}","type":"color"},"text":{"value":"{theme.intent.info.onSubtle.value}","type":"color"},"border":{"value":"{theme.intent.info.border.value}","type":"color"},"icon":{"value":"{theme.intent.info.fill.value}","type":"color"}},"success":{"bg":{"value":"{theme.intent.success.subtle.value}","type":"color"},"text":{"value":"{theme.intent.success.onSubtle.value}","type":"color"},"border":{"value":"{theme.intent.success.border.value}","type":"color"},"icon":{"value":"{theme.intent.success.fill.value}","type":"color"}},"warning":{"bg":{"value":"{theme.intent.warning.subtle.value}","type":"color"},"text":{"value":"{theme.intent.warning.onSubtle.value}","type":"color"},"border":{"value":"{theme.intent.warning.border.value}","type":"color"},"icon":{"value":"{theme.intent.warning.fill.value}","type":"color"}},"danger":{"bg":{"value":"{theme.intent.danger.subtle.value}","type":"color"},"text":{"value":"{theme.intent.danger.onSubtle.value}","type":"color"},"border":{"value":"{theme.intent.danger.border.value}","type":"color"},"icon":{"value":"{theme.intent.danger.fill.value}","type":"color"}}},"kbd":{"radius":{"value":"{radius.sm.value}","type":"borderRadius"},"fontFamily":{"value":"{font.family.mono.value}","type":"fontFamilies"},"bg":{"value":"{theme.surface.subdued.value}","type":"color"},"border":{"value":"{theme.border.default.value}","type":"color"}},"toast":{"_comment":"Transient notification surface. Floats top-right by default.","radius":{"value":"{radius.2xl.value}","type":"borderRadius"},"paddingX":{"value":"{spacing.4.value}","type":"spacing"},"paddingY":{"value":"{spacing.3.value}","type":"spacing"},"gap":{"value":"{spacing.3.value}","type":"spacing"},"minWidth":{"value":"320px","type":"sizing"},"maxWidth":{"value":"480px","type":"sizing"},"bg":{"value":"{theme.surface.floating.value}","type":"color"},"border":{"value":"{theme.border.subtle.value}","type":"color"},"shadow":{"value":"{theme.shadow.lg.value}","type":"boxShadow"},"text":{"value":"{theme.content.strong.value}","type":"color"},"textMuted":{"value":"{theme.content.muted.value}","type":"color"},"accentSuccess":{"value":"{theme.intent.success.fill.value}","type":"color"},"accentWarning":{"value":"{theme.intent.warning.fill.value}","type":"color"},"accentDanger":{"value":"{theme.intent.danger.fill.value}","type":"color"},"accentInfo":{"value":"{theme.intent.info.fill.value}","type":"color"}}}'), c0 = { _comment: "Universal focus ring — apply on ALL interactive elements for accessibility.", width: { value: "{border.width.2.value}", type: "borderWidth" }, offset: { value: "{border.width.2.value}", type: "borderWidth" }, color: { value: "{theme.border.focus.value}", type: "color" }, shadow: { value: "{theme.shadow.focus.value}", type: "boxShadow" } }, Ga = {
  component: i0,
  focusRing: c0
}, u0 = { name: { value: "light", type: "other" }, scheme: { value: "light", type: "other" }, _comment: "Theme-dependent primitives. These get aliased by the semantic layer.", surface: { _comment: "Background layers, painted from bottom (canvas) up to floating (popovers).", canvas: { value: "{color.neutral.50.value}", type: "color" }, subdued: { value: "{color.neutral.100.value}", type: "color" }, default: { value: "{color.neutral.0.value}", type: "color" }, raised: { value: "{color.neutral.0.value}", type: "color" }, overlay: { value: "{color.neutral.0.value}", type: "color" }, floating: { value: "{color.neutral.0.value}", type: "color" }, inverse: { value: "{color.neutral.900.value}", type: "color" }, glassTint: { value: "rgba(255, 255, 255, 0.65)", type: "color" }, glassBorder: { value: "rgba(255, 255, 255, 0.85)", type: "color" }, scrim: { value: "rgba(9, 9, 11, 0.45)", type: "color" } }, content: { _comment: "Text and icon colors layered by emphasis.", strong: { value: "{color.neutral.950.value}", type: "color" }, default: { value: "{color.neutral.800.value}", type: "color" }, muted: { value: "{color.neutral.600.value}", type: "color" }, subtle: { value: "{color.neutral.500.value}", type: "color" }, disabled: { value: "{color.neutral.400.value}", type: "color" }, onInverse: { value: "{color.neutral.0.value}", type: "color" }, onAccent: { value: "{color.neutral.0.value}", type: "color" }, link: { value: "{color.lavender.600.value}", type: "color" }, linkHover: { value: "{color.lavender.700.value}", type: "color" } }, border: { subtle: { value: "{color.neutral.200.value}", type: "color" }, default: { value: "{color.neutral.300.value}", type: "color" }, strong: { value: "{color.neutral.500.value}", type: "color" }, focus: { value: "{color.lavender.500.value}", type: "color" }, inverse: { value: "{color.neutral.900.value}", type: "color" } }, intent: { _comment: "Each intent has fill/onFill/subtle/onSubtle/border/strong. Use semantic 'intent.success.*' etc.", primary: { fill: { value: "{color.neutral.950.value}", type: "color" }, fillHover: { value: "{color.neutral.800.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.lavender.100.value}", type: "color" }, onSubtle: { value: "{color.lavender.800.value}", type: "color" }, border: { value: "{color.neutral.900.value}", type: "color" }, strong: { value: "{color.lavender.700.value}", type: "color" } }, accent: { fill: { value: "{color.lavender.500.value}", type: "color" }, fillHover: { value: "{color.lavender.600.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.lavender.100.value}", type: "color" }, onSubtle: { value: "{color.lavender.800.value}", type: "color" }, border: { value: "{color.lavender.400.value}", type: "color" }, strong: { value: "{color.lavender.700.value}", type: "color" } }, success: { fill: { value: "{color.sage.600.value}", type: "color" }, fillHover: { value: "{color.sage.700.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.sage.100.value}", type: "color" }, onSubtle: { value: "{color.sage.800.value}", type: "color" }, border: { value: "{color.sage.400.value}", type: "color" }, strong: { value: "{color.sage.700.value}", type: "color" } }, warning: { fill: { value: "{color.amber.500.value}", type: "color" }, fillHover: { value: "{color.amber.600.value}", type: "color" }, onFill: { value: "{color.neutral.950.value}", type: "color" }, subtle: { value: "{color.amber.100.value}", type: "color" }, onSubtle: { value: "{color.amber.900.value}", type: "color" }, border: { value: "{color.amber.400.value}", type: "color" }, strong: { value: "{color.amber.700.value}", type: "color" } }, danger: { fill: { value: "{color.coral.600.value}", type: "color" }, fillHover: { value: "{color.coral.700.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.coral.100.value}", type: "color" }, onSubtle: { value: "{color.coral.800.value}", type: "color" }, border: { value: "{color.coral.400.value}", type: "color" }, strong: { value: "{color.coral.700.value}", type: "color" } }, info: { fill: { value: "{color.ocean.500.value}", type: "color" }, fillHover: { value: "{color.ocean.600.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.ocean.100.value}", type: "color" }, onSubtle: { value: "{color.ocean.800.value}", type: "color" }, border: { value: "{color.ocean.400.value}", type: "color" }, strong: { value: "{color.ocean.700.value}", type: "color" } }, blush: { _comment: "Decorative accent often paired with lavender in references.", fill: { value: "{color.blush.400.value}", type: "color" }, fillHover: { value: "{color.blush.500.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.blush.100.value}", type: "color" }, onSubtle: { value: "{color.blush.800.value}", type: "color" }, border: { value: "{color.blush.300.value}", type: "color" }, strong: { value: "{color.blush.600.value}", type: "color" } } }, shadow: { _comment: "Layered soft shadows for the 'lifted card' feel in references.", none: { value: "none", type: "boxShadow" }, xs: { value: "0 1px 2px 0 rgba(9, 9, 11, 0.04)", type: "boxShadow" }, sm: { value: "0 1px 2px 0 rgba(9, 9, 11, 0.05), 0 1px 3px 0 rgba(9, 9, 11, 0.06)", type: "boxShadow" }, md: { value: "0 2px 4px -1px rgba(9, 9, 11, 0.06), 0 4px 8px -2px rgba(9, 9, 11, 0.08)", type: "boxShadow" }, lg: { value: "0 4px 8px -2px rgba(9, 9, 11, 0.06), 0 12px 24px -4px rgba(9, 9, 11, 0.10)", type: "boxShadow" }, xl: { value: "0 8px 16px -4px rgba(9, 9, 11, 0.08), 0 24px 48px -12px rgba(9, 9, 11, 0.14)", type: "boxShadow" }, "2xl": { value: "0 16px 32px -8px rgba(9, 9, 11, 0.10), 0 48px 96px -24px rgba(9, 9, 11, 0.20)", type: "boxShadow" }, inner: { value: "inset 0 1px 2px 0 rgba(9, 9, 11, 0.06)", type: "boxShadow" }, focus: { value: "0 0 0 4px rgba(139, 92, 246, 0.24)", type: "boxShadow" }, focusDanger: { value: "0 0 0 4px rgba(239, 68, 68, 0.24)", type: "boxShadow" } }, blur: { none: { value: "0px", type: "other" }, xs: { value: "4px", type: "other" }, sm: { value: "8px", type: "other" }, md: { value: "16px", type: "other" }, lg: { value: "24px", type: "other" }, xl: { value: "40px", type: "other" }, "2xl": { value: "64px", type: "other" } }, gradient: { _comment: "Hero/atmospheric gradients. Use sparingly for backgrounds and accents.", lavenderMist: { value: "linear-gradient(135deg, #F5F3FF 0%, #FFE4EC 100%)", type: "other" }, blushSky: { value: "linear-gradient(135deg, #FFE4EC 0%, #DBEAFE 100%)", type: "other" }, auroraSoft: { value: "linear-gradient(135deg, #EDE9FE 0%, #FFE4EC 50%, #DBEAFE 100%)", type: "other" }, sunsetSubtle: { value: "linear-gradient(135deg, #FEF3C7 0%, #FFE4EC 100%)", type: "other" }, mintLight: { value: "linear-gradient(135deg, #DCFCE7 0%, #F5F3FF 100%)", type: "other" }, neutralRise: { value: "linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)", type: "other" } } }, dC = {
  theme: u0
}, d0 = { name: { value: "dark", type: "other" }, scheme: { value: "dark", type: "other" }, surface: { _comment: "In dark mode, surface gets BRIGHTER as it rises (raised > canvas) to mimic light hitting it.", canvas: { value: "{color.neutral.950.value}", type: "color" }, subdued: { value: "{color.neutral.900.value}", type: "color" }, default: { value: "{color.neutral.900.value}", type: "color" }, raised: { value: "{color.neutral.800.value}", type: "color" }, overlay: { value: "{color.neutral.800.value}", type: "color" }, floating: { value: "{color.neutral.700.value}", type: "color" }, inverse: { value: "{color.neutral.50.value}", type: "color" }, glassTint: { value: "rgba(24, 24, 27, 0.65)", type: "color" }, glassBorder: { value: "rgba(255, 255, 255, 0.08)", type: "color" }, scrim: { value: "rgba(0, 0, 0, 0.65)", type: "color" } }, content: { strong: { value: "{color.neutral.0.value}", type: "color" }, default: { value: "{color.neutral.100.value}", type: "color" }, muted: { value: "{color.neutral.400.value}", type: "color" }, subtle: { value: "{color.neutral.500.value}", type: "color" }, disabled: { value: "{color.neutral.600.value}", type: "color" }, onInverse: { value: "{color.neutral.950.value}", type: "color" }, onAccent: { value: "{color.neutral.0.value}", type: "color" }, link: { value: "{color.lavender.400.value}", type: "color" }, linkHover: { value: "{color.lavender.300.value}", type: "color" } }, border: { subtle: { value: "{color.neutral.800.value}", type: "color" }, default: { value: "{color.neutral.700.value}", type: "color" }, strong: { value: "{color.neutral.500.value}", type: "color" }, focus: { value: "{color.lavender.400.value}", type: "color" }, inverse: { value: "{color.neutral.100.value}", type: "color" } }, intent: { primary: { fill: { value: "{color.neutral.0.value}", type: "color" }, fillHover: { value: "{color.neutral.100.value}", type: "color" }, onFill: { value: "{color.neutral.950.value}", type: "color" }, subtle: { value: "{color.lavender.950.value}", type: "color" }, onSubtle: { value: "{color.lavender.200.value}", type: "color" }, border: { value: "{color.neutral.100.value}", type: "color" }, strong: { value: "{color.lavender.300.value}", type: "color" } }, accent: { fill: { value: "{color.lavender.500.value}", type: "color" }, fillHover: { value: "{color.lavender.400.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.lavender.950.value}", type: "color" }, onSubtle: { value: "{color.lavender.200.value}", type: "color" }, border: { value: "{color.lavender.600.value}", type: "color" }, strong: { value: "{color.lavender.300.value}", type: "color" } }, success: { fill: { value: "{color.sage.500.value}", type: "color" }, fillHover: { value: "{color.sage.400.value}", type: "color" }, onFill: { value: "{color.neutral.950.value}", type: "color" }, subtle: { value: "{color.sage.950.value}", type: "color" }, onSubtle: { value: "{color.sage.200.value}", type: "color" }, border: { value: "{color.sage.700.value}", type: "color" }, strong: { value: "{color.sage.300.value}", type: "color" } }, warning: { fill: { value: "{color.amber.400.value}", type: "color" }, fillHover: { value: "{color.amber.300.value}", type: "color" }, onFill: { value: "{color.neutral.950.value}", type: "color" }, subtle: { value: "{color.amber.950.value}", type: "color" }, onSubtle: { value: "{color.amber.200.value}", type: "color" }, border: { value: "{color.amber.700.value}", type: "color" }, strong: { value: "{color.amber.300.value}", type: "color" } }, danger: { fill: { value: "{color.coral.500.value}", type: "color" }, fillHover: { value: "{color.coral.400.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.coral.950.value}", type: "color" }, onSubtle: { value: "{color.coral.200.value}", type: "color" }, border: { value: "{color.coral.700.value}", type: "color" }, strong: { value: "{color.coral.300.value}", type: "color" } }, info: { fill: { value: "{color.ocean.500.value}", type: "color" }, fillHover: { value: "{color.ocean.400.value}", type: "color" }, onFill: { value: "{color.neutral.0.value}", type: "color" }, subtle: { value: "{color.ocean.950.value}", type: "color" }, onSubtle: { value: "{color.ocean.200.value}", type: "color" }, border: { value: "{color.ocean.700.value}", type: "color" }, strong: { value: "{color.ocean.300.value}", type: "color" } }, blush: { fill: { value: "{color.blush.400.value}", type: "color" }, fillHover: { value: "{color.blush.300.value}", type: "color" }, onFill: { value: "{color.neutral.950.value}", type: "color" }, subtle: { value: "{color.blush.950.value}", type: "color" }, onSubtle: { value: "{color.blush.200.value}", type: "color" }, border: { value: "{color.blush.700.value}", type: "color" }, strong: { value: "{color.blush.300.value}", type: "color" } } }, shadow: { _comment: "Dark shadows are deeper and more saturated. Add subtle inner highlight for raised surfaces.", none: { value: "none", type: "boxShadow" }, xs: { value: "0 1px 2px 0 rgba(0, 0, 0, 0.40)", type: "boxShadow" }, sm: { value: "0 1px 2px 0 rgba(0, 0, 0, 0.50), 0 1px 3px 0 rgba(0, 0, 0, 0.40)", type: "boxShadow" }, md: { value: "0 2px 4px -1px rgba(0, 0, 0, 0.50), 0 4px 8px -2px rgba(0, 0, 0, 0.40)", type: "boxShadow" }, lg: { value: "0 4px 8px -2px rgba(0, 0, 0, 0.50), 0 12px 24px -4px rgba(0, 0, 0, 0.50)", type: "boxShadow" }, xl: { value: "0 8px 16px -4px rgba(0, 0, 0, 0.60), 0 24px 48px -12px rgba(0, 0, 0, 0.60)", type: "boxShadow" }, "2xl": { value: "0 16px 32px -8px rgba(0, 0, 0, 0.70), 0 48px 96px -24px rgba(0, 0, 0, 0.80)", type: "boxShadow" }, inner: { value: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.40)", type: "boxShadow" }, focus: { value: "0 0 0 4px rgba(167, 139, 250, 0.40)", type: "boxShadow" }, focusDanger: { value: "0 0 0 4px rgba(248, 113, 113, 0.40)", type: "boxShadow" } }, blur: { none: { value: "0px", type: "other" }, xs: { value: "4px", type: "other" }, sm: { value: "8px", type: "other" }, md: { value: "16px", type: "other" }, lg: { value: "24px", type: "other" }, xl: { value: "40px", type: "other" }, "2xl": { value: "64px", type: "other" } }, gradient: { lavenderMist: { value: "linear-gradient(135deg, #2E1065 0%, #500724 100%)", type: "other" }, blushSky: { value: "linear-gradient(135deg, #500724 0%, #172554 100%)", type: "other" }, auroraSoft: { value: "linear-gradient(135deg, #2E1065 0%, #500724 50%, #172554 100%)", type: "other" }, sunsetSubtle: { value: "linear-gradient(135deg, #451A03 0%, #500724 100%)", type: "other" }, mintLight: { value: "linear-gradient(135deg, #052E16 0%, #2E1065 100%)", type: "other" }, neutralRise: { value: "linear-gradient(180deg, #09090B 0%, #18181B 100%)", type: "other" } } }, fC = {
  theme: d0
};
function f0(e) {
  return typeof e == "object" && typeof e.value == "string";
}
function p0(e) {
  return e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
}
function v0(e) {
  return `--ds-${e.map(p0).join("-")}`;
}
function m0(e, t) {
  let o = e;
  const r = /\{([^}]+)\}/g;
  let n = 0;
  for (; r.test(o) && n < 10; )
    r.lastIndex = 0, o = o.replace(r, (a, l) => {
      const i = l.split(".");
      let u = t;
      for (const p of i)
        if (typeof u == "object" && p in u)
          u = u[p];
        else
          return console.warn(`Could not resolve token reference: ${a} at ${l}`), a;
      return typeof u == "string" ? u : a;
    }), n++;
  return o;
}
function h0(e, t) {
  const o = e;
  if (["spacing", "sizing", "borderRadius", "borderWidth", "fontSizes"].includes(t)) {
    if (o.endsWith("px") || o.endsWith("rem") || o.endsWith("em") || o === "0" || o.endsWith("%"))
      return o;
    if (!isNaN(parseFloat(o)))
      return `${String(parseFloat(o))}px`;
  }
  return o;
}
function pC(e, t = ":root") {
  const o = e.theme ? e : { theme: e }, r = {
    color: Zx.color,
    spacing: ct.spacing,
    radius: ct.radius,
    border: ct.border,
    size: ct.size,
    breakpoint: ct.breakpoint,
    zIndex: ct.zIndex,
    motion: a0.motion,
    font: Wa.font,
    textStyle: Wa.textStyle,
    theme: o.theme,
    component: Ga.component,
    focusRing: Ga.focusRing
  }, n = {};
  function a(i, u) {
    if (typeof i == "object") {
      if (f0(i)) {
        const p = u[0];
        if (p !== void 0 && ["theme", "component", "focusRing"].includes(p) && i.type !== "typography") {
          const f = m0(i.value, r), d = h0(f, i.type), v = v0(u);
          n[v] = d;
        }
        return;
      }
      for (const p of Object.keys(i))
        a(i[p], [...u, p]);
    }
  }
  a(r, []);
  const l = Object.entries(n).sort(([i], [u]) => i.localeCompare(u)).map(([i, u]) => `  ${i}: ${u};`).join(`
`);
  return `${t} {
${l}
}`;
}
export {
  K0 as Accordion,
  Hw as AccordionContent,
  zw as AccordionItem,
  Bw as AccordionTrigger,
  Uf as Alert,
  G0 as AlertDialog,
  sw as AlertDialogAction,
  lw as AlertDialogCancel,
  tw as AlertDialogContent,
  aw as AlertDialogDescription,
  rw as AlertDialogFooter,
  ow as AlertDialogHeader,
  Hu as AlertDialogOverlay,
  ew as AlertDialogPortal,
  nw as AlertDialogTitle,
  V0 as AlertDialogTrigger,
  w0 as AspectRatio,
  Bf as Avatar,
  Lf as Badge,
  vw as Breadcrumb,
  ww as BreadcrumbEllipsis,
  hw as BreadcrumbItem,
  gw as BreadcrumbLink,
  mw as BreadcrumbList,
  bw as BreadcrumbPage,
  yw as BreadcrumbSeparator,
  Za as Button,
  Ww as Calendar,
  Ef as Card,
  sx as Carousel,
  lx as CarouselContent,
  ix as CarouselItem,
  ux as CarouselNext,
  cx as CarouselPrevious,
  Kf as Checkbox,
  x0 as Collapsible,
  S0 as CollapsibleContent,
  C0 as CollapsibleTrigger,
  j0 as Combobox,
  Y0 as CommandDialog,
  q0 as CommandGroup,
  dx as CommandInput,
  fx as CommandItem,
  X0 as CommandList,
  px as CommandShortcut,
  _0 as DropdownMenu,
  Bb as DropdownMenuCheckboxItem,
  $b as DropdownMenuContent,
  M0 as DropdownMenuGroup,
  zb as DropdownMenuItem,
  Wb as DropdownMenuLabel,
  I0 as DropdownMenuPortal,
  k0 as DropdownMenuRadioGroup,
  Hb as DropdownMenuRadioItem,
  Gb as DropdownMenuSeparator,
  Vb as DropdownMenuShortcut,
  D0 as DropdownMenuSub,
  Lb as DropdownMenuSubContent,
  Fb as DropdownMenuSubTrigger,
  T0 as DropdownMenuTrigger,
  Yf as FormField,
  $0 as HoverCard,
  Ay as HoverCardContent,
  z0 as HoverCardTrigger,
  Qa as Input,
  ax as InputOTP,
  Xf as Label,
  Vx as Menubar,
  Kx as MenubarContent,
  lC as MenubarGroup,
  jx as MenubarItem,
  sC as MenubarMenu,
  iC as MenubarPortal,
  uC as MenubarRadioGroup,
  Yx as MenubarSeparator,
  Xx as MenubarShortcut,
  cC as MenubarSub,
  Ux as MenubarTrigger,
  _f as Message,
  Ja as Modal,
  jf as NavGroup,
  If as NavItem,
  xw as Pagination,
  Cw as PaginationContent,
  Ew as PaginationEllipsis,
  Sw as PaginationItem,
  Qn as PaginationLink,
  Nw as PaginationNext,
  Rw as PaginationPrevious,
  gg as Popover,
  N0 as PopoverAnchor,
  ii as PopoverContent,
  bg as PopoverTrigger,
  nx as Progress,
  jp as RadioGroup,
  Yp as RadioGroupItem,
  aC as ResizableHandle,
  nC as ResizablePanel,
  rC as ResizablePanelGroup,
  Gv as ScrollArea,
  yl as ScrollBar,
  O0 as Select,
  vy as SelectContent,
  F0 as SelectGroup,
  hy as SelectItem,
  my as SelectLabel,
  su as SelectScrollDownButton,
  au as SelectScrollUpButton,
  gy as SelectSeparator,
  py as SelectTrigger,
  L0 as SelectValue,
  xv as Separator,
  B0 as Sheet,
  W0 as SheetClose,
  Ly as SheetContent,
  Hy as SheetDescription,
  zy as SheetFooter,
  $y as SheetHeader,
  Cu as SheetOverlay,
  Oy as SheetPortal,
  By as SheetTitle,
  H0 as SheetTrigger,
  vx as Sidebar,
  Z0 as SidebarContent,
  oC as SidebarFooter,
  Q0 as SidebarGroup,
  J0 as SidebarGroupLabel,
  eC as SidebarMenu,
  mx as SidebarMenuButton,
  tC as SidebarMenuItem,
  R0 as Skeleton,
  uv as Slider,
  hp as Switch,
  Gw as Table,
  Uw as TableBody,
  qw as TableCaption,
  Xw as TableCell,
  Kw as TableFooter,
  Yw as TableHead,
  Vw as TableHeader,
  jw as TableRow,
  U0 as Tabs,
  pw as TabsContent,
  dw as TabsList,
  fw as TabsTrigger,
  qf as Textarea,
  Of as Toast,
  dv as Toggle,
  hv as ToggleGroup,
  gv as ToggleGroupItem,
  P0 as Tooltip,
  Hg as TooltipContent,
  E0 as TooltipProvider,
  A0 as TooltipTrigger,
  Vf as alertVariants,
  $f as avatarVariants,
  Ff as badgeVariants,
  We as buttonVariants,
  Nf as cardVariants,
  S as cn,
  pC as compileThemeToCSS,
  fC as defaultDarkTheme,
  dC as defaultLightTheme,
  Ks as toggleVariants
};
