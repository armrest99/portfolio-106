import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

let query = '';
let selectedIndex = -1;
let selectedYear = null;

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `${projects.length} Projects`;

function updateProjects() {
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();

        let matchesSearch = values.includes(query.toLowerCase());

        let matchesYear = selectedYear === null ||
            String(project.year) === String(selectedYear);

        return matchesSearch && matchesYear;
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
}

function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);

    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();

    arcs.forEach((arc, idx) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .on('click', () => {
                let clickedYear = data[idx].label;
                selectedYear =
                    String(selectedYear) === String(clickedYear) && selectedYear !== null
                        ? null
                        : clickedYear;

                selectedIndex = selectedYear === null ? -1 : idx;

                svg.selectAll('path')
                    .attr('class', (_, i) =>
                        i === selectedIndex ? 'selected' : ''
                    );

                legend.selectAll('li')
                    .attr('class', (_, i) =>
                        i === selectedIndex
                            ? 'legend-item selected'
                            : 'legend-item'
                    );

                updateProjects();
            });
    });

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
    selectedIndex = data.findIndex(
        (d) => selectedYear !== null &&
            String(d.label) === String(selectedYear)
    );

    svg.selectAll('path')
        .attr('class', (_, i) =>
            i === selectedIndex ? 'selected' : ''
        );

    legend.selectAll('li')
        .attr('class', (_, i) =>
            i === selectedIndex
                ? 'legend-item selected'
                : 'legend-item'
        );
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value;

    updateProjects();

    let searchFilteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });

    renderPieChart(searchFilteredProjects);
});