import { NextRequest, NextResponse } from 'next/server'
import Docker from 'dockerode'
import * as fsPromises from "node:fs/promises";
import { fileExists } from '@/src/utils';

const docker = new Docker();

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const uuid = searchParams.get('uuid');
    if (!uuid) {
        return NextResponse.json({ msg: 'Invalid UUID' }, { status: 400 });
    }
    const body = await request.json();
    const { code } = body;

    try {
        // Create and start the container
        const container = await docker.createContainer({
            Image: 'your-benchmark-image:latest',
            Cmd: ['node', 'benchmark.js'],
            Env: [`CODE=${code}`],
            name: `benchmark-${uuid}`,
            Volumes: {
                '/results': {}
            },
            HostConfig: {
                Binds: [`/path/on/host:/results`]
            }
        });
        await container.start();
        container.wait().then(() => container.remove()).catch(console.error);
        return NextResponse.json({ msg: 'Benchmark Started Success' }, { status: 200, statusText: "ok" })
    } catch (error) {
        console.error('Error in benchmark:', error);
        return NextResponse.json({ msg: 'Benchmark Started Failure' }, { status: 500, statusText: 'error' })
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const uuid = searchParams.get('uuid');
    if (!uuid) {
        return NextResponse.json({ msg: 'Invalid UUID' }, { status: 400 });
    }


    try {
        const exists = await fileExists(`/path/on/host/${uuid}.html`)
        if (exists) {
            const result = await fsPromises.readFile(`/path/on/host/${uuid}.html`, 'utf8');
            return NextResponse.json({ msg: 'Benchmark Completed', result }, { status: 200 });
        } else {
            return NextResponse.json({ msg: 'Benchmark Running' }, { status: 200 });
        }
    } catch (e) {
        console.error('Error checking benchmark status:', e);
        return NextResponse.json({ msg: `${e}` }, { status: 500 })
    }
    
    // try {
    //     const container = docker.getContainer(`benchmark-${uuid}`)
    //     const info = await container.inspect()
    //     const isRunning = info.State.Running

    //     if (isRunning) {
    //         return NextResponse.json({ msg: 'Benchmark Running' }, { status: 200 })
    //     } else {
    //         const result = await fsPromises.readFile(`/path/on/host/${uuid}.html`, 'utf8');
    //         return NextResponse.json({ msg: 'Benchmark Completed', result }, { status: 200 });
    //     }
    // } catch (e) {
    //     console.error('Error checking benchmark status:', e);
    //     return NextResponse.json({ msg: `${e}` }, { status: 500 })
    // }
}