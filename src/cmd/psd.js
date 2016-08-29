import path from 'path'
import fs from 'fs-extra'
import PSD from 'psd'

import Lia from '../lia'
import log from '../utils/log'
import images from 'images'

const TMP = './.lia'
const EXT = '.png'

async function rewrite(option) {
    let {src, psd} = option
    let file = PSD.fromFile(psd)

    file.parse()

    let tree = file.tree()
    let stamp = Date.now()

    let destSrc = await Promise.all(src.map(async (pattern, index) => {
        let group = tree.childrenAtPath(pattern)[0]
        let children = group ? group.children() : []

        let data = await Promise.all(children.map(async node => {
            let filename = `${stamp++}${EXT}`
            let output = path.resolve(TMP, index + '', filename)
            let buffer = await read(node)

            return {
                buffer,
                output,
                node
            }
        }))

        let destTop = Math.max(0, Math.min(...data.map(item => item.node.layer.top)))
        let destBottom = Math.max(0, Math.max(...data.map(item => item.node.layer.bottom)))
        let destLeft = Math.max(0, Math.min(...data.map(item => item.node.layer.left)))
        let destRight = Math.max(0, Math.max(...data.map(item => item.node.layer.right)))

        let destWidth = destRight - destLeft
        let destHeight = destBottom - destTop

        data.forEach(item => {
            let {node, buffer, output} = item
            let {top, left} = node.layer

            if (!node.hidden()) {
                let img = images(destWidth, destHeight)
                let main = images(buffer)
                let buf = img.draw(main, left - destLeft, top - destTop).encode('png')

                fs.outputFileSync(output, buf, 'binary')
            }
        })

        return path.join(TMP, index + '', '/*')
    }))

    return Promise.resolve(Object.assign({}, option, {
        src: destSrc
    }))
}

function read(node) {
    return new Promise(fulfill => {
        let png = node.toPng()

        var buffers = []
        var nread = 0

        let readStream = png.pack()

        readStream.on('data', function(chunk) {
            buffers.push(chunk)
            nread += chunk.length
        })
        readStream.on('end', function() {
            let buffer = new Buffer(nread)

            for (let i = 0, pos = 0, l = buffers.length; i < l; i++) {
                let chunk = buffers[i]
                chunk.copy(buffer, pos)
                pos += chunk.length
            }

            fulfill(buffer)
        })
    })
}

async function run(config) {
    await Promise.all(config.map(async conf => {
        let option = await rewrite(conf)
        let lia = new Lia(option)
        lia.run()
    }))

    fs.removeSync(TMP)
}

export default async function() {
    let confPath = path.resolve(process.cwd(), 'sprite_conf.js')
    let config

    try {
        config = require(confPath)
    } catch (e) {
        log.warn('sprite_conf.js not Found. Try `lia init`.')
        return false
    }

    await run(config)
}
