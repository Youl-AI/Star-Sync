/** `resolve-ts-ext.mjs`의 훅을 등록하는 부트스트랩. `--import`로 물린다. */
import { register } from "node:module";

register("./resolve-ts-ext.mjs", import.meta.url);
