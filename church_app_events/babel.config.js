module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
        ["module:react-native-dotenv", {
            "moduleName": "react-native-config",
            "path": ".env",
            "blacklist": null,
            "whitelist": null,
            "safe": false,
            "allowUndefined": true
        }]
    ]
};