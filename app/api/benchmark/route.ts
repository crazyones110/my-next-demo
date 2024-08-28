import { NextRequest, NextResponse } from 'next/server'
import Docker from 'dockerode'
import * as fsPromises from "node:fs/promises";
import { fileExists } from '@/src/utils';
import * as path from 'node:path';
import { glob } from 'glob';

const docker = new Docker();

const hostVolumePath = `/Users/crazyones110/pratice/next-demo/volumes/benchmark`;

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const uuid = searchParams.get('uuid');
    if (!uuid) {
        return NextResponse.json({ msg: 'Invalid UUID' }, { status: 400 });
    }
    const body = await request.json();
    const { code } = body;
    try {
        // https://docs.docker.com/reference/api/engine/v1.46/#tag/Container/operation/ContainerCreate
        const container = await docker.createContainer({
            Image: 'tmp-backend:latest',
            // Cmd: ['node', 'benchmark.js'],
            Env: [`CODE=${code}`, `UUID=${uuid}`],
            name: `benchmark-${uuid}`,
            Volumes: {
                '/benchmark': {}
            },
            HostConfig: {
                Binds: [`${hostVolumePath}:/benchmark`],
                // TODO when image can automatically exit, enable AutoRemove option
                // AutoRemove: true,
                // TODO specify cpu shares based on cpu cores
                // CpuShares: 512,
            }
        });
        await container.start();
        // container.wait().then(() => container.remove()).catch(console.error);
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
        const artifactDir = path.resolve(hostVolumePath, "./artifact");
        const files = await glob(`${uuid}*.html`, { cwd: artifactDir });
        if (files.length === 0) {
            // TODO: Check if container is stopped due to error
            return NextResponse.json({ msg: 'Benchmark Running' }, { status: 200 });
        } else {
            const result = await fsPromises.readFile(path.resolve(artifactDir, files.at(-1)!), 'utf8');
            docker.getContainer(`benchmark-${uuid}`).stop().catch(console.error);
            return NextResponse.json({ msg: 'Benchmark Completed', result }, { status: 200 });
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