import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/test/**/*.test.ts"] },
  // tsconfig의 `@/*` 별칭을 여기서도 알려 준다. Next는 tsconfig를 읽지만
  // vitest는 읽지 않아서, 별칭으로 import하는 모듈이 테스트에서만 안 잡힌다.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
