import { useEffect, useRef } from "react";
import type { NextPage } from "next";

import { App } from "../../lib/005/script.js";

const Page005: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef<App>(new App());

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
  }, []);

  // キーダウンで停止、キーアップで再開
  useEffect(() => {
    // キーの押下や離す操作を検出できるようにする
    window.addEventListener(
      "keydown",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            appRef.current.stop();
            break;
          default:
        }
      },
      false
    );
    window.addEventListener(
      "keyup",
      (keyEvent) => {
        appRef.current.start();
      },
      false
    );
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas id="webgl-canvas" />
    </div>
  );
};
export default Page005;
