import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable ALL TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/prefer-namespace-keyword": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-misused-new": "off",
      "@typescript-eslint/prefer-function-type": "off",
      "@typescript-eslint/unified-signatures": "off",
      "@typescript-eslint/no-array-constructor": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      "@typescript-eslint/adjacent-overload-signatures": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-duplicate-enum-values": "off",
      "@typescript-eslint/no-extra-non-null-assertion": "off",
      "@typescript-eslint/no-loss-of-precision": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/prefer-literal-enum-member": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-implied-eval": "off",
      "@typescript-eslint/no-throw-literal": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-for-in-array": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/unbound-method": "off",
      
      // Disable general rules that might conflict
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
      "no-use-before-define": "off",
      "no-array-constructor": "off",
      "no-unused-expressions": "off",
      "no-useless-constructor": "off",
      "no-loss-of-precision": "off",
      "no-implied-eval": "off",
      "no-throw-literal": "off",
    },
  },
];

export default eslintConfig;
