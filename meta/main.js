import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    return data;
}

function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/armrest99/portfolio-106/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };
            Object.defineProperty(ret, 'lines', {
                value: lines,
                enumerable: false,
                configurable: true,
                writable: true,
            });
            return ret;
        });
}

function renderCommitInfo(data, commits) {
    const dl = d3.select('#stats')
        .append('dl')
        .attr('class', 'stats');

    dl.append('dt')
        .html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd')
        .text(data.length);

    dl.append('dt')
        .text('Total commits');
    dl.append('dd')
        .text(commits.length);

    dl.append('dt')
        .text('Total files');
    dl.append('dd')
        .text(d3.group(data, d => d.file).size);

    dl.append('dt')
        .text('Average line length');
    dl.append('dd')
        .text(d3.mean(data, d => d.length).toFixed(2));

    dl.append('dt')
        .text('Maximum depth');
    dl.append('dd')
        .text(d3.max(data, d => d.depth));

    dl.append('dt')
        .text('Longest line');
    dl.append('dd')
        .text(d3.max(data, d => d.length) + ' characters');
}

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([0, width])
        .nice();

    const yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', 5)
        .attr('fill', 'steelblue');
    
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(
        d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.width)
    );
    
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);