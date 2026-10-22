import { useEffect, useRef, useState } from "react";

export function Notebook3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) {
      setFallback(true);
      return;
    }

    const vs = `
      attribute vec3 aPos;
      attribute vec2 aUv;
      varying vec2 vUv;
      uniform float uT;
      void main() {
        float c = cos(uT);
        float s = sin(uT);
        vec3 p = aPos;
        float x = p.x * c - p.z * s;
        float z = p.x * s + p.z * c;
        p.x = x; p.z = z;
        p.y += sin(uT * 1.4) * 0.06;
        vUv = aUv;
        gl_Position = vec4(p.x * 0.92, p.y * 0.92, p.z * 0.2, 1.0 + p.z * 0.25);
      }
    `;
    const fs = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      void main() {
        vec4 c = texture2D(uTex, vUv);
        if (c.a < 0.08) discard;
        gl_FragColor = c;
      }
    `;

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      return sh;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    const verts = new Float32Array([
      -0.72, -0.78, 0, 0, 1,
      0.72, -0.78, 0, 1, 1,
      -0.72, 0.78, 0, 0, 0,
      0.72, 0.78, 0, 1, 0,
    ]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    const aUv = gl.getAttribLocation(prog, "aUv");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 20, 12);

    const tex = gl.createTexture();
    const img = new Image();
    img.src = "/images/notebook-float.png";
    let ready = false;
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
    };
    img.onerror = () => setFallback(true);

    const uT = gl.getUniformLocation(prog, "uT");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      const t = (performance.now() - t0) / 1000;
      gl.uniform1f(uT, Math.sin(t * 0.7) * 0.45);
      if (ready) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (fallback) {
    return (
      <img
        src="/images/notebook-float.png"
        alt="Floating notebook"
        className="w-full h-full object-contain"
        style={{ animation: "floaty 6s ease-in-out infinite" }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Floating notebook"
    />
  );
}
