import ColorHash from 'color-hash' 

type SummitId = string 

interface Summit {
  id: SummitId,
  title: string,
  description: string, 
  x: number, 
  y: number, 
  r: number
}

interface SummitData {
  title: string
  description: string
}

type Connection = [SummitId, ConnectionFeatures]

interface SummitConnections {
  to: Connection[], 
  from: Connection[]
}

interface ConnectionFeatures {
  value: number
}

interface SummitRoles {
  roles: Role[]
}

interface Role {
  name: string
  identity: string
}

interface SummitGeometry {
  x: number
  y: number
  r: number
}

interface SummitUpdate {
  id: SummitId
  data?: SummitData
  connections?: SummitConnections
  roles?: SummitRoles
  geometry: SummitGeometry
}

window.addEventListener('load', run)

interface SummitSvgComponents {
  g: SVGGElement
  circle: SVGCircleElement
  text: SVGTextElement
}

const SVG_NS = "http://www.w3.org/2000/svg"

async function run() {
  const svg = document.createElementNS(SVG_NS, 'svg') 
  document.body.appendChild(svg) 
  svg.style.width = "100vw" 
  svg.style.height = "100vh"

  const graph = document.createElementNS(SVG_NS, 'g') 
  svg.appendChild(graph) 
  let scale = 100; 
  let tx = document.body.clientWidth / 2
  let ty = document.body.clientHeight / 2
  graph.setAttribute('transform', ` translate(${tx} ${ty}) scale(${scale})`) 
  
  let summits: {[id: SummitId]: Summit } = {}
  let summitEls: {[id: SummitId]: SummitSvgComponents} = {}
  // type ConnectionMap = {[from: SummitId]: ({[to: SummitId]: SVGPathElement}) }
  // interface ConnectionEls {
  //   fromTo: ConnectionMap, 
  //   toFrom: ConnectionMap
  // }
  // let connectionEls: ConnectionEls = {
  //   fromTo: {}, 
  //   toFrom: {}
  // }

  const summitColorHash = new ColorHash({ lightness: 0.4 })

  const getOrCreateSummit = (summitId: SummitId) => {
    if(summitId in summits) {
      return summits[summitId]
    } else {
      const nEls = summitEls[summitId] = {
        circle: document.createElementNS(SVG_NS, 'circle'),
        text: document.createElementNS(SVG_NS, 'text'), 
        g: document.createElementNS(SVG_NS, 'g')
      }
      setAttributes(nEls.circle, {
        x: '0', 
        y: '0', 
        r: '1', 
        stroke: 'none', 
        fill: summitColorHash.hex(summitId)
      })
      setAttributes(nEls.text, {
        x: '0', 
        y: '0', 
        'class': 'summit-title',
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
      })
      setAttributes(nEls.g, {
        'class': 'summit'
      }) 
      nEls.g.appendChild(nEls.circle)
      nEls.g.appendChild(nEls.text) 
      graph.appendChild(nEls.g)

      console.log("added to svg") 

      return summits[summitId] = {
        id: summitId, 
        title: "", 
        description: "",
        x: undefined, 
        y: undefined, 
        r: undefined, 
      }
    }
  }

  const updateData = (summit: Summit, data: SummitData) => {
    setSummitTitle(summit, data.title) 
    setSummitDescription(summit, data.description)
  }
  const setSummitTitle = (summit: Summit, title: string) => {
    if(summit.title !== title) {
      let el = summitEls[summit.id]
      el.text.textContent = title
    }
    summit.title = title
  }
  const setSummitDescription = (summit: Summit, description: string) => {
    summit.description = description
  }

  const updateGeometry = (summit: Summit, geo: SummitGeometry) => {
    let change = updateNumericField(summit, 'x', geo.x)
    change = updateNumericField(summit, 'y', geo.y) || change
    change = updateNumericField(summit, 'r', geo.r) || change
    if(change) {
      redrawSummit(summit) 
    }
  }
  const updateNumericField = (summit: Summit, field: 'x' | 'y' | 'r', v: number) => {
    if(summit[field] !== v) {
      summit[field] = v
      return true
    } else {
      return false
    }
  }

  const setAttributes = (node: SVGElement | HTMLElement, attribs: {[name: string]: string}) => {
    for(let attrib in attribs) {
      node.setAttribute(attrib, attribs[attrib])
    }
  }

  const redrawSummit = (summit: Summit) => {
    let el = summitEls[summit.id]
    console.log(summit)
    el.g.setAttribute('transform', `scale(${summit.r}) translate(${summit.x} ${summit.y})`)
    redrawAllConnections(summit) 
  }

  const redrawAllConnections = (_summit: Summit) => {
    // TODO
  }

  const updateConnections = (_summit: Summit, _data: SummitConnections) => {
    // TODO
  }

  const updateRoles = (_summit: Summit, _data: SummitRoles) => {
    // TODO
  }

  let socket = new WebSocket('ws://localhost:3030/v1')
  socket.onmessage = (event) => {
    const summitUpdate = JSON.parse(event.data) as SummitUpdate;

    console.log("received summit update") 

    const summit = getOrCreateSummit(summitUpdate.id) 
    summitUpdate.data && updateData(summit, summitUpdate.data)
    summitUpdate.geometry && updateGeometry(summit, summitUpdate.geometry)
    summitUpdate.roles && updateRoles(summit, summitUpdate.roles) 
    summitUpdate.connections && updateConnections(summit, summitUpdate.connections) 
  };
  console.log(socket)
}
