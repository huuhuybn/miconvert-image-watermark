import typescript from '@rollup/plugin-typescript';

export default {
    input: 'lib/index.ts',
    output: [
        {
            file: 'dist/image-watermark.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'auto',
        },
        {
            file: 'dist/image-watermark.mjs',
            format: 'esm',
            sourcemap: true,
        },
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: './dist',
        }),
    ],
};
