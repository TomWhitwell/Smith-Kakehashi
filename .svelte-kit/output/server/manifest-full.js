export const manifest = {
	appDir: "app",
	appPath: "app",
	assets: new Set([".DS_Store","css/fa-all.min.css","favicon.png","webfonts/fa-brands-400.eot","webfonts/fa-brands-400.svg","webfonts/fa-brands-400.ttf","webfonts/fa-brands-400.woff","webfonts/fa-brands-400.woff2","webfonts/fa-regular-400.eot","webfonts/fa-regular-400.svg","webfonts/fa-regular-400.ttf","webfonts/fa-regular-400.woff","webfonts/fa-regular-400.woff2","webfonts/fa-solid-900.eot","webfonts/fa-solid-900.svg","webfonts/fa-solid-900.ttf","webfonts/fa-solid-900.woff","webfonts/fa-solid-900.woff2"]),
	mimeTypes: {".css":"text/css",".png":"image/png",".eot":"application/vnd.ms-fontobject",".svg":"image/svg+xml",".ttf":"font/ttf",".woff":"font/woff",".woff2":"font/woff2"},
	_: {
		client: {"start":"app/immutable/entry/start.74676cb5.js","app":"app/immutable/entry/app.541dd87c.js","imports":["app/immutable/entry/start.74676cb5.js","app/immutable/chunks/index.bd603792.js","app/immutable/chunks/singletons.0c7fa1bf.js","app/immutable/chunks/index.10e3ed9b.js","app/immutable/entry/app.541dd87c.js","app/immutable/chunks/index.bd603792.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0], errors: [1], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
