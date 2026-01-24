import base from "@repo/eslint-config/base";

export default [
    ...base,
    {
        ignores: ["dist/**", ".opencode/**", "coverage/**"]
    }
];
