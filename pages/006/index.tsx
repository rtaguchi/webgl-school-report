import { useEffect, useRef } from "react";
import type { NextPage } from "next";
import { Pane } from "tweakpane";
// import { useTweaks } from "use-tweaks";
import { App } from "../../lib/006/script.js";

const Page006: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef<App>(new App());
  // const paneRef = useRef<Pane>(new Pane());
  const parameter = {
    culling: true,
    depthTest: true,
    rotation: false,
  };
  // const { culling, depthTest, rotation } = useTweaks({
  //   culling: true,
  //   depthTest: true,
  //   rotation: false,
  // });

  useEffect(() => {
    // appRef.current = new App();
    appRef.current.init();
    appRef.current.load().then(() => {
      // if (appRef.current) {
      appRef.current.setupGeometry();
      appRef.current.setupLocation();
      appRef.current.start();
      // }
    });
    // }, []);

    // appRef.current.setCulling(culling);
    // appRef.current.setDepthTest(depthTest);
    // appRef.current.setRotation(rotation);

    // バックフェイスカリングの有効・無効
    const pane = new Pane();
    pane.addInput(parameter, "culling").on("change", (v: any) => {
      appRef.current.setCulling(v.value);
    });
    // 深度テストの有効・無効
    pane.addInput(parameter, "depthTest").on("change", (v: any) => {
      appRef.current.setDepthTest(v.value);
    });
    // 回転の有無
    pane.addInput(parameter, "rotation").on("change", (v: any) => {
      appRef.current.setRotation(v.value);
    });
  }, []);
  // }, []);

  // // キーダウンで停止、キーアップで再開
  // useEffect(() => {
  //   // キーの押下や離す操作を検出できるようにする
  //   window.addEventListener(
  //     "keydown",
  //     (keyEvent) => {
  //       switch (keyEvent.key) {
  //         case " ":
  //           appRef.current.stop();
  //           break;
  //         default:
  //       }
  //     },
  //     false
  //   );
  //   window.addEventListener(
  //     "keyup",
  //     (keyEvent) => {
  //       appRef.current.start();
  //     },
  //     false
  //   );
  // }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas id="webgl-canvas" />
    </div>
  );
};
export default Page006;
