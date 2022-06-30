import { useEffect, useRef } from "react";
import type { NextPage } from "next";

// 必要なモジュールを読み込み
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const getQuaternion = (vec1: any, vec2: any) => {
  const tangent = new THREE.Vector3().crossVectors(vec1, vec2);
  tangent.normalize();

  const cos = vec1.dot(vec2);
  const radians = Math.acos(cos);

  return new THREE.Quaternion().setFromAxisAngle(tangent, radians);
};

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
  renderer: any; // レンダラ
  scene: any; // シーン
  camera: any; // カメラ
  spotLight: any;
  spotLight2: any;
  directionalLight: any; // ディレクショナルライト
  ambientLight: any; // アンビエントライト
  geometry: any; //ジオメトリ
  geometry2: any; //ジオメトリ
  material: any; // マテリアル
  boxArray: any; // ボックスメッシュ
  controls: any; // オービットコントロール
  axesHelper: any; // 軸ヘルパー
  isDown: any; // キーの押下状態を保持するフラグ
  lightAngle: any;
  lightAngle2: any;
  helicopter: any;
  earth: any;
  target: any;

  /*
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      // fovy は Field of View Y のことで、縦方向の視野角を意味する
      fovy: 60,
      // 描画する空間のアスペクト比（縦横比）
      aspect: window.innerWidth / window.innerHeight,
      // 描画する空間のニアクリップ面（最近面）
      near: 0.1,
      // 描画する空間のファークリップ面（最遠面）
      far: 200.0,
      // カメラの位置
      x: 50.0,
      y: 30.0,
      z: 50.0,
      // カメラの中止点
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      // レンダラーが背景をリセットする際に使われる背景色
      clearColor: 0xfdeeea,
      // レンダラーが描画する領域の横幅
      width: window.innerWidth,
      // レンダラーが描画する領域の縦幅
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1.0, // 光の強度
      x: 1.0, // 光の向きを表すベクトルの X 要素
      y: 1.0, // 光の向きを表すベクトルの Y 要素
      z: 1.0, // 光の向きを表すベクトルの Z 要素
    };
  }
  /**
   * スポットライト定義のための定数
   */
  static get SPOT_LIGHT_PARAM() {
    return {
      color: 0x0000ff, // 光の色
      color2: 0xff0000, // 光の色
      intensity: 2, // 光の強度
      distance: 50,
      decay: 2,
      x: 40.0,
      y: 0.0,
      z: 0.0,
    };
  }

  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.1, // 光の強度
    };
  }
  /**
   * マテリアル定義のための定数
   */

  static get MATERIAL_PARAM2() {
    return {
      color: 0x6f74a0, // マテリアルの基本色
    };
  }

  static get EARTH_SIZE() {
    return 30.0;
  }

  static get SKY_HEIGHT() {
    return 2.0;
  }

  static get BASE_VECTOR() {
    return new THREE.Vector3(0, 1, 0);
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.isDown = false; // キーの押下状態を保持するフラグ

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    const canvas = document.querySelector("#webgl");
    if (!canvas) return;

    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.scene.add(this.directionalLight);

    // 球体のジオメトリを生成
    const sphereGeometry = new THREE.SphereGeometry(App3.EARTH_SIZE, 64, 64);

    // 地球のマテリアルとメッシュ
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff, // マテリアルの基本色
      transparent: true,
      opacity: 0.9,
    });
    // earthMaterial.map = this.earthTexture;
    this.earth = new THREE.Mesh(sphereGeometry, earthMaterial);
    this.scene.add(this.earth);

    this.helicopter = new Helicopter(this.scene);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 50.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    this.helicopter.rotationFin();
    const heli = this.helicopter.returnHeli();
    // heli.position.x += 0.1;
    const heliPosition = heli.position.clone();

    // this.helicopter.updateLightHelper();

    // コントロールを更新
    this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

  console(text: string | number) {
    console.log(text);
  }
}

class Destination {
  targetObj: any;
  lineObjs: any;
  // lightObjs: any;
  lineGeo: any;
  lineMate: any;
  line: any;
  scene: any;

  constructor(upperScene: any) {
    this.scene = upperScene;
    const targetMate = new THREE.MeshToonMaterial({ color: 0xf19ebc });
    const targetGeo = new THREE.TorusGeometry(2, 0.25, 16, 32);
    this.targetObj = new THREE.Mesh(targetGeo, targetMate);

    this.targetObj.rotation.x = Math.PI / 2;
    this.scene.add(this.targetObj);

    this.lineMate = new THREE.LineBasicMaterial({ color: 0xf19ebc });
  }

  drawLine(posVec: any, destVec: any) {
    if (this.line) {
      this.scene.remove(this.line);
    }
    // // ２つのベクトルの回転軸
    const axis = posVec.clone().cross(destVec);
    axis.normalize();

    // // ２つのベクトルが織りなす角度
    const angle = posVec.clone().angleTo(destVec);
    const angleSeg = Math.floor(angle / 0.05);

    // ２つの衛星を結ぶ弧を描くための頂点を打つ
    const lineObjs = [];
    for (let i = 0; i < angleSeg; i++) {
      // axisを軸としたクォータニオンを生成
      const q = new THREE.Quaternion().setFromAxisAngle(
        axis,
        (angle / angleSeg) * i
      );
      // ベクトルを回転させる
      const pos = posVec
        .clone()
        .applyQuaternion(q)
        .multiplyScalar(App3.EARTH_SIZE + App3.SKY_HEIGHT);
      lineObjs.push(pos);
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(lineObjs);
    this.line = new THREE.Line(lineGeo, this.lineMate);

    this.scene.add(this.line);
  }

  setDestinationPosition(posVec: any, destVec: any) {
    this.targetObj.position.set(
      destVec.x * App3.EARTH_SIZE,
      destVec.y * App3.EARTH_SIZE,
      destVec.z * App3.EARTH_SIZE
    );
    const qtn = getQuaternion(posVec, destVec);
    this.targetObj.quaternion.premultiply(qtn);

    this.drawLine(posVec, destVec);
  }
}

class Helicopter {
  fin: any;
  finSpeed: any;
  heli: any;
  heliAngle: any;
  xzAngle: any;
  xyAngle: any;
  flyingHeight: any;
  departure: any;
  destination: any;
  target: any;
  lightHelper: any;
  waitCounter: any;
  light1: any;
  light2: any;
  lightShift: any;
  lightShiftDirection: any;
  destDirection: any;
  straght: any;
  rotateAxis: any;

  static get MATERIAL_PARAM() {
    return {
      color: 0x9e999c, // マテリアルの基本色
    };
  }

  static get BASE_VECTOR() {
    return new THREE.Vector3(0, 1, 0);
  }

  constructor(upperScene: any) {
    this.finSpeed = 0;
    this.waitCounter = 0;
    this.lightShift = 0;
    this.lightShiftDirection = true;
    this.straght = false;

    const bodyGeo = new THREE.CapsuleGeometry(0.8, 1.8, 4.0, 8.0);
    const bodyMate = new THREE.MeshPhongMaterial(Helicopter.MATERIAL_PARAM);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMate);
    bodyMesh.rotation.z = Math.PI / 2;

    const tailGeo = new THREE.CylinderGeometry(0.15, 0.4, 4.0, 32);
    const tailMesh = new THREE.Mesh(tailGeo, bodyMate);
    tailMesh.rotation.z = Math.PI / 2 - ((2 * Math.PI) / 360) * 5;
    tailMesh.position.x = -2.0;
    const ohireGeo = new THREE.CylinderGeometry(
      1.0,
      1.0,
      0.1,
      32,
      1,
      false,
      0,
      Math.PI / 4
    );
    const ohireMesh = new THREE.Mesh(ohireGeo, bodyMate);
    ohireMesh.rotation.x = -Math.PI / 2;
    ohireMesh.rotation.y = -Math.PI / 2 + ((2 * Math.PI) / 360) * 5;
    ohireMesh.position.x = -3.0;
    ohireMesh.position.y = 0.2;

    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.0, 32);
    const legRight = new THREE.Mesh(legGeo, bodyMate);
    legRight.rotation.z = Math.PI / 2;
    legRight.position.y = -1.0;
    legRight.position.z = 0.5;
    const legLeft = new THREE.Mesh(legGeo, bodyMate);
    legLeft.rotation.z = Math.PI / 2;
    legLeft.position.y = -1.0;
    legLeft.position.z = -0.5;

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.1, 32);
    const poleFR = new THREE.Mesh(poleGeo, bodyMate);
    poleFR.rotation.x = -((2 * Math.PI) / 360) * 30;
    poleFR.position.x = 0.8;
    poleFR.position.y = -0.5;
    poleFR.position.z = 0.22;
    const poleRR = new THREE.Mesh(poleGeo, bodyMate);
    poleRR.rotation.x = -((2 * Math.PI) / 360) * 30;
    poleRR.position.x = -0.8;
    poleRR.position.y = -0.5;
    poleRR.position.z = 0.22;
    const poleFL = new THREE.Mesh(poleGeo, bodyMate);
    poleFL.rotation.x = ((2 * Math.PI) / 360) * 30;
    poleFL.position.x = 0.8;
    poleFL.position.y = -0.5;
    poleFL.position.z = -0.22;
    const poleRL = new THREE.Mesh(poleGeo, bodyMate);
    poleRL.rotation.x = ((2 * Math.PI) / 360) * 30;
    poleRL.position.x = -0.8;
    poleRL.position.y = -0.5;
    poleRL.position.z = -0.22;

    const boxGeo = new THREE.BoxGeometry(0.3, 7.0, 0.05);
    const boxMesh1 = new THREE.Mesh(boxGeo, bodyMate);
    boxMesh1.rotation.x = Math.PI / 2;
    boxMesh1.rotation.y = Math.PI / 15;
    boxMesh1.position.y = 2.1;
    const boxMesh2 = new THREE.Mesh(boxGeo, bodyMate);
    boxMesh2.rotation.x = Math.PI / 2;
    boxMesh2.rotation.z = Math.PI / 2;
    boxMesh2.rotation.x -= Math.PI / 15;
    boxMesh2.position.y = 2.1;
    const finGeo = new THREE.ConeGeometry(0.2, 0.4, 32);
    const finMesh = new THREE.Mesh(finGeo, bodyMate);
    finMesh.rotation.x = Math.PI;
    finMesh.position.y = 1.9;

    const body = new THREE.Group();
    body.add(tailMesh);
    body.add(ohireMesh);
    body.add(bodyMesh);
    body.add(legRight);
    body.add(legLeft);
    body.add(poleFR);
    body.add(poleRR);
    body.add(poleFL);
    body.add(poleRL);
    body.position.y = 1.0;
    body.rotation.y = (Math.PI * 3) / 2;

    this.fin = new THREE.Group();
    this.fin.add(boxMesh1);
    this.fin.add(boxMesh2);
    this.fin.add(finMesh);

    this.light1 = new THREE.SpotLight(0xff0000, 1, 10, Math.PI / 5, 0.2);
    this.light1.position.z = 1.5;
    this.light1.position.x = -0.5;
    this.light1.target.position.z = 4;
    this.light1.target.position.x = -0.5;
    this.light1.castShadow = true;
    this.light2 = new THREE.SpotLight(0xff0000, 1, 10, Math.PI / 5, 0.2);
    this.light2.position.z = 1.5;
    this.light2.position.x = 0.5;
    this.light2.castShadow = true;
    this.light2.target.position.z = 4;
    this.light2.target.position.x = 0.5;

    // this.lightHelper = new THREE.SpotLightHelper(light1);
    // upperScene.add(this.lightHelper);

    this.heli = new THREE.Group();
    this.heli.add(body);
    this.heli.add(this.fin);
    this.heli.add(this.light1);
    this.heli.add(this.light2);
    this.heli.add(this.light1.target);
    this.heli.add(this.light2.target);
    this.flyingHeight = App3.EARTH_SIZE;
    this.heliAngle = 0;

    const initialVector = new THREE.Vector3(0, 1, 0).normalize();

    const qtn = getQuaternion(new THREE.Vector3(0, 1, 0), initialVector);
    this.heli.quaternion.premultiply(qtn);

    this.heli.position.set(
      initialVector.x * this.flyingHeight,
      initialVector.y * this.flyingHeight,
      initialVector.z * this.flyingHeight
    );

    upperScene.add(this.heli);

    this.target = new Destination(upperScene);
    this.setDestination(
      new THREE.Vector3(
        Math.random(),
        Math.random() - 0.6,
        Math.random()
      ).normalize()
    );
  }

  // updateLightHelper() {
  //   this.lightHelper.update();
  // }

  setDestination(destVec: any) {
    this.destination = destVec;
    this.target.setDestinationPosition(
      this.heli.position.clone().normalize(),
      destVec
    );
    const posVec = this.heli.position.clone().normalize();
    // // ２つのベクトルの回転軸
    const axis = posVec.clone().cross(destVec);
    axis.normalize();
    // axisを軸としたクォータニオンを生成
    const qtn = new THREE.Quaternion().setFromAxisAngle(axis, 0.001);
    // ベクトルを回転させる
    const nextVec = posVec.clone().applyQuaternion(qtn).normalize();

    this.destDirection = nextVec.clone().normalize().sub(posVec).normalize();
    this.straght = false;

    const z = this.heli.getWorldDirection(new THREE.Vector3());
    this.rotateAxis = this.destDirection.clone().cross(z);
  }

  moveLight() {
    this.light1.target.position.x = -0.5 + this.lightShift;
    this.light2.target.position.x = 0.5 + this.lightShift;

    if (this.lightShift > 1) {
      this.lightShiftDirection = false;
    } else if (this.lightShift < -1) {
      this.lightShiftDirection = true;
    }
    this.lightShift += this.lightShiftDirection ? 0.05 : -0.05;
  }

  goForward() {
    const posVec = this.heli.position.clone().normalize();
    const destVec = this.destination.clone().normalize();

    // // ２つのベクトルの回転軸
    const axis = posVec.clone().cross(destVec);
    axis.normalize();

    // axisを軸としたクォータニオンを生成
    const qtn = new THREE.Quaternion().setFromAxisAngle(axis, 0.005);
    // ベクトルを回転させる
    const pos = posVec
      .clone()
      .applyQuaternion(qtn)
      .multiplyScalar(App3.EARTH_SIZE + App3.SKY_HEIGHT);
    this.heli.position.set(pos.x, pos.y, pos.z);

    const qtn2 = getQuaternion(posVec, pos.clone().normalize());
    this.heli.quaternion.premultiply(qtn2);

    this.heli.up.copy(posVec.clone().normalize());
    const lookVec = new THREE.Vector3().subVectors(posVec, destVec);

    const qtn3 = new THREE.Quaternion().setFromAxisAngle(axis, 0.01);
    // ベクトルを回転させる
    const pos3 = posVec
      .clone()
      .applyQuaternion(qtn3)
      .multiplyScalar(App3.EARTH_SIZE + App3.SKY_HEIGHT);
    this.heli.lookAt(pos3);

    const muki = pos3.clone().normalize().sub(posVec).normalize();

    const z = this.heli.getWorldDirection(new THREE.Vector3());
    const cos = muki.clone().normalize().dot(z);
    const radians = Math.acos(cos);
    console.log(radians);
  }

  rotationFin() {
    // ２つのベクトルが織りなす角度
    const posVec = this.heli.position.clone().normalize();
    const destVec = this.destination.clone().normalize();
    const angle = posVec.angleTo(destVec);

    // 目的地と機体の向きのなす角度
    const z = this.heli.getWorldDirection(new THREE.Vector3());
    const cos = this.destDirection.clone().normalize().dot(z);
    console.log(cos);
    const radians = Math.acos(cos);

    if (angle < 0.01) {
      if (this.flyingHeight > App3.EARTH_SIZE) {
        this.flyingHeight -= 0.02;
      } else {
        if (this.finSpeed >= 0) {
          this.finSpeed -= 0.001;
        } else {
          this.finSpeed = 0;
          if (this.waitCounter > 100) {
            this.waitCounter = 0;
            this.setDestination(
              new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
              ).normalize()
            );
          } else {
            this.waitCounter += 1;
          }
        }
      }
      this.heli.position.set(
        posVec.x * this.flyingHeight,
        posVec.y * this.flyingHeight,
        posVec.z * this.flyingHeight
      );
    } else {
      if (this.finSpeed < 0.2) {
        this.finSpeed += 0.0005;
      } else {
        if (this.flyingHeight < App3.EARTH_SIZE + App3.SKY_HEIGHT) {
          this.flyingHeight += 0.01;
        } else {
          // console.log(radians);
          if (radians < 0.1 || this.straght) {
            this.straght = true;
            this.goForward();
            this.moveLight();
          } else {
            this.rotationHeli(this.destDirection, z);
          }
        }
        const positionVector = this.heli.position.clone().normalize();
        this.heli.position.set(
          positionVector.x * this.flyingHeight,
          positionVector.y * this.flyingHeight,
          positionVector.z * this.flyingHeight
        );
      }
    }

    this.fin.rotation.y -= this.finSpeed;
  }

  rotationHeli(dest: any, z: any) {
    // ベクトルとラジアンからクォータニオンを定義
    const qtn = new THREE.Quaternion().setFromAxisAngle(
      this.rotateAxis,
      -0.005
    );
    // ヘリの現在のクォータニオンに乗算する
    this.heli.quaternion.premultiply(qtn);
  }

  returnHeli() {
    return this.heli;
  }
}

const Page003: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef(new App3());
  const countRef = useRef(0);

  useEffect(() => {
    // キーの押下や離す操作を検出できるようにする
    window.addEventListener(
      "keydown",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            appRef.current.isDown = true;
            break;
          case "c":
            appRef.current.helicopter;
          default:
        }
      },
      false
    );
    window.addEventListener(
      "keyup",
      (keyEvent) => {
        appRef.current.isDown = false;
      },
      false
    );

    // リサイズイベント
    window.addEventListener(
      "resize",
      () => {
        appRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
        appRef.current.camera.aspect = window.innerWidth / window.innerHeight;
        appRef.current.camera.updateProjectionMatrix();
        appRef.current.console(appRef.current.camera.aspect);
      },
      false
    );
  }, []);

  useEffect(() => {
    if (countRef.current === 0) {
      appRef.current.init();
      appRef.current.render();
    }
  }, []);

  return <canvas id="webgl" />;
};
export default Page003;
