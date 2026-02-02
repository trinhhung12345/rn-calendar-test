module.exports = function (api) {
  api.cache(true);

  let plugins = [];

  // Plugin cho Alias (Cấu hình đường dẫn @)
  plugins.push([
    'module-resolver',
    {
      root: ['./src'],
      extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
      alias: {
        '@components': './src/components',
        '@screens': './src/screens',
        '@navigation': './src/navigation',
        '@hooks': './src/hooks',
        '@utils': './src/utils',
        '@constants': './src/constants',
        '@services': './src/services',
        '@assets': './assets', // Map assets nếu muốn import nhanh
        '@store': './src/store',
      },
    },
  ]);

  // Plugin worklets của bạn (Thường dùng cho Reanimated)
  // LƯU Ý: Reanimated yêu cầu plugin này phải nằm cuối cùng trong danh sách
  plugins.push('react-native-worklets/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
