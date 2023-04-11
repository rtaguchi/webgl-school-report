import { useEffect, useRef } from "react";
import type { NextPage } from "next";
import { Pane } from "tweakpane";
import { App } from "../../lib/007/script.js";

const Page007: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef<App>(new App());
  useEffect(() => {
    appRef.current.init();
    appRef.current.load().then(() => {
      appRef.current.setupGeometry();
      appRef.current.setupLocation();
      appRef.current.start();
    });

    // バックフェイスカリングの有効・無効
    const pane = new Pane();
    const parameter = {
      rotation: false,
    };

    // テクスチャの表示・非表示 @@@
    pane.addInput(parameter, "rotation").on("change", (v) => {
      appRef.current.setRotation(v.value);
    });

    // テクスチャの混ざり具合
    pane
      .addBlade({
        view: "slider",
        label: "ratio",
        min: 0.0,
        max: 1.0,
        value: 0.5,
      })
      // @ts-ignore
      .on("change", (v: any) => {
        appRef.current.setRatio(v.value);
      });
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas id="webgl-canvas" />
    </div>
  );
};
export default Page007;
