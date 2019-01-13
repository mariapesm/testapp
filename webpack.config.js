let path = require("path");
 let webpack=require("webpack");


module.exports = {
    entry: {
        index: "./src/js/index.js",
        login: "./src/js/login.js"

    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "[name].bundle.js",
        publicPath: "/dist"
    },
    devtool: "inline-source-map",

    module: {
        loaders: [
            {
                exclude: /node_modules/,
                test: /\.css$/,
                loader: "style-loader!css-loader"
            },

            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["env", 'react']
                    }

                }
            }
        ]
    },
    devServer: {
        contentBase: [path.join(__dirname, "/src/views"),
            path.join(__dirname, "/node_modules/bootstrap/dist/css")

        ],

        proxy: [
            {
                context: ["/favicon.ico", "/api","/auth"],
                target: "http://localhost:3000",
                secure:false
            }
        ] ,

    },

    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Popper: ['popper.js', 'default'],
            Util: "exports-loader?Util!bootstrap/js/dist/util",
            Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown"
        })
    ]


};
