const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')
const { reject } = require('lodash')
const { resolve } = require('path')
class QiniuManager {
    constructor(accessKey, secretKey, bucket ) {
      // 生成mac
      this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
      this.bucket = bucket
      // 初始化配置类
      this.config = new qiniu.conf.Config()
      // 空间对应的机房
      this.config.zone = qiniu.zone.Zone_z0
      this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    uploadFile(key, localFilePath) {
      // generate uploadToken
      const options = {
        scope: this.bucket + ":" + key,
      };
      const putPolicy = new qiniu.rs.PutPolicy(options)
      const uploadToken=putPolicy.uploadToken(this.mac)
      const formUploader = new qiniu.form_up.FormUploader(this.config)
      const putExtra = new qiniu.form_up.PutExtra()
      //文件上传
      return new Promise((resolve, reject) => {
        formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallback(resolve, reject));
      })
    }

    deleteFile(key) {
      return new Promise((resolve, reject) => {
        this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject))
      })
    }

    getBucketDomain () {
      const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
      const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
      // console.log('trigger here')
      return new Promise((resolve, reject) => {
        qiniu.rpc.postWithoutForm(reqURL, digest,this._handleCallback(resolve, reject))
      })
    }

    generateDownloadLink (key) {
      // 通过pubicBucketDomain判断是否重复发送请求域名
      const domainPromise = this.publicBucketDomain ? 
        Promise.resolve([this.publicBucketDomain]) : this.getBucketDomain()
      return domainPromise.then( data => {
        if (Array.isArray(data) && data.length > 0 ) {
          const pattern = /^https?/
          // 通过正则来判断publicBucketDomain有无http头
          this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data[0]}`
          return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key)
          
        } else {
          throw Error('域名未找到，请查看空间是否已经过期')
        }
      })
    }

    getStat (key) {
      return new Promise(resolve, reject).then(() => {
        this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject))
      })
    }

    downloadFile (key, downloadPath) {
      // step 1:获得下载链接
      // step 2:发送下载请求，获得一个可读流
      // step 3: 创建一个可写流并 pipe 可读流
      // step 4:返回一个Promise
      return this.generateDownloadLink(key).then(link => {
        const timeStamp = new Date().getTime()
        const url = `${link}?timestamp=${timeStamp}`
        
        return axios({
          url,
          method: 'GET',
          responseType: 'stream',
          headers: {'Cache-Control': 'no-cache'}
        })
      }).then(async response => {
        const writer = fs.createWriteStream(downloadPath,{autoClose:false})
        await response.data.pipe(await writer)
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })
      }).catch(err => {
        return Promise.reject({ err: err.response })
      })
    }

    _handleCallback (resolve, reject) {
      return (respErr, respBody, respInfo) => {
        if (respErr) {
          throw respErr;
        }
        if (respInfo.statusCode === 200) {
          resolve(respBody)
        } else {
          reject({
            statusCode: respInfo.statusCode,
            body: respBody
          })
        }
      }
    }
}

module.exports = QiniuManager