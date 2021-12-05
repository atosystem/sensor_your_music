# Sensor your music
<p align="center">
<a href="https://github.com/atosystem/sensor_your_music/"><img alt="GitHub last commit (branch)" src="https://img.shields.io/github/last-commit/atosystem/sensor_your_music/main"></a>
<a href="https://github.com/atosystem/sensor_your_music/issues" target="_blank"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/atosystem/sensor_your_music"></a>
<a href="https://github.com/atosystem/sensor_your_music/pulls" target="_blank"><img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/atosystem/sensor_your_music"></a>
</p>

<div align="center"><h2>Check out the <a href="https://atosystem.github.io/blogs/sensor-puredata">Blog Page</a>!</h2>
<br/>
<img src="https://i.imgur.com/59FqCnN.png" />

</div>






## Run

> If you want to have your own mobile page, please fork this repo first. Or, you can just clone this repo and skip step 2.

1. Install packages
    ```
    npm i
    ```

2. Build website 

    * Change config
        Go to `./main.js`
        ```
        // for qrcode generation (please change to yours after forking this repo)
        const GITHUB_USERNAME = "atosystem"
        const GITHUB_REPO_NAME = "sensor_your_music"
        ```
        and change `GITHUB_USERNAME` and `GITHUB_REPO_NAME` to yours
    * Build it
        ```
        npm run build
        ```

    * Modify url

        Go to `./dist/index.html and find the following lines
        ```
        <script type="module" crossorigin src="/assets/index.30d58a49.js"></script>
        <link rel="modulepreload" href="/assets/vendor.519c7c38.js">
        <link rel="stylesheet" href="/assets/index.53d3e83e.css">
        ```
        change the path to relative path 
        ```
        <script type="module" crossorigin src="assets/index.30d58a49.js"></script>
        <link rel="modulepreload" href="assets/vendor.519c7c38.js">
        <link rel="stylesheet" href="assets/index.53d3e83e.css">
        ```
    * Create dir for github page
        ```
        rm -rf docs
        cp -r dist docs
        ```

3. Open Puredata

    You can use my example `pd_examples/udpRecvExample.pd`

4. Start server

    ```
    npm start
    ```

    The output should be:
    ```
    Webserver Running at Port 3006
    Localhost server page at http://localhost:3006
    [ws]Listening on 3005
    ```

    Then go to `http://localhost:3006`

5. Connect your phone

    ![](https://i.imgur.com/Mqftv8t.png)
    Make sure the Udp port is matched to that in puredata.
    Click `Start Server(call)`
    ![](https://i.imgur.com/mJsFTHk.png)
    Scan the qrcode with your phone or tablet
    ![](https://i.imgur.com/jyfW7RX.jpg)
    Also, on localhost, you should see `client connect`
    ![](https://i.imgur.com/jyGv56r.png)
    On your device, press `Start Sensor` to send data
    ![](https://i.imgur.com/8RVf1Y3.jpg)
    Back to puredata, you chould see the numbers changing and the console logging.
    ![](https://i.imgur.com/JEbSziv.png)
    ![](https://i.imgur.com/v7EPbH6.png)

## Notice

*  For multiple devices, please open multiple chrome tabs on your laptop. One tab for one moblie device and each tab uses different UDP Port which corressponds to the object in puredata \[netreceive -u <udp port\>\]

## Author

Ian Shih [webpage](https://atosystem.github.io/)

## Acknowledgement

This repo is adapted from [webrtc-firebase-demo](https://github.com/fireship-io/webrtc-firebase-demo) and [JavaScript Sensor Access Demo](https://sensor-js.xyz/demo.html)
