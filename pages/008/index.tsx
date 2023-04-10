import { useEffect, useRef } from "react";
import type { NextPage } from "next";
import { Pane } from "tweakpane";
import { App } from "../../lib/008/script.js";

const Page008: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef<App>(new App());
  useEffect(() => {
    appRef.current.init();
    appRef.current.load().then(() => {
      appRef.current.setupGeometry();
      appRef.current.setupLocation();
      appRef.current.start();
    });

    const pane = new Pane();
    const parameter = {
      useTypeOne: true,
    };
    // ノイズ生成ロジックのタイプ @@@
    pane.addInput(parameter, "useTypeOne").on("change", (v) => {
      appRef.current.useTypeOne(v.value);
    });
    // 時間の経過速度 @@@
    pane
      .addBlade({
        view: "slider",
        label: "time speed",
        min: 0.0,
        max: 2.0,
        value: 1.0,
      })
      .on("change", (v) => {
        appRef.current.setTimeSpeed(v.value);
      });
    // ノイズのアルファ値 @@@
    pane
      .addBlade({
        view: "slider",
        label: "alpha",
        min: 0.0,
        max: 1.0,
        value: 0.5,
      })
      .on("change", (v) => {
        appRef.current.setAlpha(v.value);
      });
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas id="webgl-canvas" />
    </div>
  );
};
export default Page008;
