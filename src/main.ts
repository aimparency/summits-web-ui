import ColorHash from 'color-hash' 
import { Vector2 } from 'three'
import Color from 'color'

type SummitId = string 

interface Summit {
  id: SummitId,
  title: string,
  description: string, 
  x: number, 
  y: number, 
  r: number, 
  connections: SummitConnections
}

interface SummitData {
  title: string
  description: string
}

interface Connection {
  from: SummitId, 
  to: SummitId, 
  value: number
}

interface SummitConnections {
  to: {[id: SummitId]: Connection}, 
  from: {[id: SummitId]: Connection}
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
const SQR_3_4 = Math.sqrt(3/4) 

async function run() {
  const svg = document.createElementNS(SVG_NS, 'svg') 
  document.body.appendChild(svg) 
  svg.style.width = "100vw" 
  svg.style.height = "100vh"

  const graph = document.createElementNS(SVG_NS, 'g') 
  svg.appendChild(graph) 
  let scale = 70; 
  let tx = document.body.clientWidth / 2
  let ty = document.body.clientHeight / 2
  graph.setAttribute('transform', ` translate(${tx} ${ty}) scale(${scale})`) 

  const connectionsG = document.createElementNS(SVG_NS, 'g') 
  graph.appendChild(connectionsG)

  const summitsG = document.createElementNS(SVG_NS, 'g') 
  graph.appendChild(summitsG)

  
  let summits: {[id: SummitId]: Summit } = {}
  let summitEls: {[id: SummitId]: SummitSvgComponents} = {}
  type ConnectionMap = {[from: SummitId]: ({[to: SummitId]: SVGPathElement}) }
  let connectionEls: ConnectionMap = {}

  const summitColorHash = new ColorHash({ lightness: 0.4 })

  const getOrCreateSummit = (summitId: SummitId) => {
    if(summitId in summits) {
      return summits[summitId]
    } else {
      const sEls = summitEls[summitId] = {
        circle: document.createElementNS(SVG_NS, 'circle'),
        text: document.createElementNS(SVG_NS, 'text'), 
        g: document.createElementNS(SVG_NS, 'g')
      }
      setAttributes(sEls.circle, {
        x: '0', 
        y: '0', 
        r: '1', 
        stroke: 'none', 
        fill: summitColorHash.hex(summitId)
      })
      setAttributes(sEls.text, {
        x: '0', 
        y: '0', 
        'class': 'summit-title',
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
      })
      setAttributes(sEls.g, {
        'class': 'summit'
      }) 

      sEls.g.appendChild(sEls.circle)
      sEls.g.appendChild(sEls.text) 
      summitsG.appendChild(sEls.g)


      return summits[summitId] = {
        id: summitId, 
        title: "", 
        description: "",
        x: undefined, 
        y: undefined, 
        r: undefined, 
        connections: {
          to: {},
          from: {}
        }
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
    el.g.setAttribute('transform', `translate(${summit.x} ${summit.y}) scale(${summit.r})`)
    redrawAllConnections(summit) 
  }

  const getOrCreateConnectionEl = (fromId: SummitId, toId: SummitId): SVGPathElement => {
    if(!(fromId in connectionEls)) {
      connectionEls[fromId] = {}
    }
    if(!(toId in connectionEls[fromId])) {
      const cPath = document.createElementNS(SVG_NS, 'path')
      let color = Color(summitColorHash.hex(fromId)).lighten(0.7)
      setAttributes(cPath, {
        'class': 'connection', 
        'fill': color.hex() + 'AA'
      })
      connectionsG.appendChild(cPath)
      connectionEls[fromId][toId] = cPath
      return cPath
    } else {
      return connectionEls[fromId][toId]
    }
  } 

  const redrawAllConnections = (summit: Summit) => {
    Object.keys(summit.connections.to).forEach(to => {
      redrawConnection(summit, summits[to], summit.connections.to[to]) 
    })
    Object.keys(summit.connections.from).forEach(from => {
      redrawConnection(summits[from], summit, summit.connections.from[from]) 
    })
  }

  const redrawConnection = (from: Summit, to: Summit, connection: Connection) => {
    const cPath = getOrCreateConnectionEl(from.id, to.id) 

    let mFrom = new Vector2(from.x, from.y)
    let mTo = new Vector2(to.x, to.y) 

    // normalized vector from 'from' to 'to' 
    const norm = mTo.clone().sub(mFrom).normalize() 
    const half = norm.clone().multiplyScalar(0.5)


    // length of the vector from n/2 to the intersection of circle around 0 and around n
    let side = new Vector2(norm.y, -norm.x).multiplyScalar(SQR_3_4)

    let s0 = half.clone().add(side)
    let s1 = half.clone().sub(side)

    let taille0 = s0.clone().add(new Vector2(-s0.y, s0.x).multiplyScalar(1 - connection.value))
    let taille1 = s1.clone().add(new Vector2(s1.y, -s1.x).multiplyScalar(1 - connection.value))

    const prepareVec = (v: Vector2, m: Vector2, r: number) => {
      let nv = v.clone().multiplyScalar(r).add(m)
      return nv.x + " " + nv.y
    }

    const makeCoordinates = (m: Vector2, r: number) => {
      return {
        s0: prepareVec(s0, m, r), 
        s1: prepareVec(s1, m, r), 
        m: prepareVec(new Vector2(0,0), m, r), 
        taille0: prepareVec(taille0, m, r), 
        taille1: prepareVec(taille1, m, r) 
      }
    }

    const coordsFrom = makeCoordinates(mFrom, from.r) 

    s0.negate()
    s1.negate()
    taille0.negate()
    taille1.negate()

    const coordsTo = makeCoordinates(mTo.clone().sub(norm.clone().multiplyScalar(to.r)), to.r)

    let path = [
      'M', coordsFrom.m, 
      'L', coordsFrom.s1, 
      'C', coordsFrom.taille1, coordsTo.taille0, coordsTo.s0, 
      'L', coordsTo.m, 
      'L', coordsTo.s1, 
      'C', coordsTo.taille1, coordsFrom.taille0, coordsFrom.s0, 
      'Z' 
    ].join(' ')

    setAttributes(cPath, {
      d: path
    })
  }

  const updateConnections = (summit: Summit, connections: SummitConnections) => {
    Object.keys(connections.to).forEach(to => {
      const connection = connections.to[to]
      updateConnection(connection)
    })
    Object.keys(connections.from).forEach(from => {
      const connection = connections.from[from]
      updateConnection(connection)
    })

  }

  const updateConnection = (connection: Connection) => {
    if(connection.from in summits && connection.to in summits) {
      const from = summits[connection.from]
      const to = summits[connection.to]
      let updatedConnection = undefined
      if(!(connection.to in from.connections.to)) {
        from.connections.to[connection.to] = connection
        to.connections.from[connection.from] = connection
        updatedConnection = connection
      } else {
        const prevCon = from.connections.to[connection.to]
        if(prevCon.value !== connection.value) {
          prevCon.value = connection.value
          updatedConnection = prevCon
        }
      }
      if (updatedConnection !== undefined) {
        redrawConnection(from, to, updatedConnection)
      }
    }
  }

  const updateRoles = (_summit: Summit, _data: SummitRoles) => {
    // TODO
  }

  let socket = new WebSocket('ws://localhost:3030/v1')
  socket.onmessage = (event) => {
    const summitUpdate = JSON.parse(event.data) as SummitUpdate;

    const summit = getOrCreateSummit(summitUpdate.id) 
    summitUpdate.data && updateData(summit, summitUpdate.data)
    summitUpdate.geometry && updateGeometry(summit, summitUpdate.geometry)
    summitUpdate.roles && updateRoles(summit, summitUpdate.roles) 
    summitUpdate.connections && updateConnections(summit, summitUpdate.connections) 
  };
}
