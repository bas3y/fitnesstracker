import { sampleGpx } from '../../test/importFiles';
import { ImportFileError } from './types';
import { isXml, parseGpx, parseTcx, sportFromText } from './xml';

const START = Date.parse('2026-10-02T17:00:00Z');
const run = { start: START, step: 10, count: 4, speed: 3, heartRate: (i: number) => 140 + i };

const TCX = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>2026-10-03T08:00:00Z</Id>
      <Lap StartTime="2026-10-03T08:00:00Z">
        <TotalTimeSeconds>600</TotalTimeSeconds>
        <DistanceMeters>5000</DistanceMeters>
        <Calories>150</Calories>
        <AverageHeartRateBpm><Value>130</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>150</Value></MaximumHeartRateBpm>
        <Track>
          <Trackpoint>
            <Time>2026-10-03T08:00:00Z</Time>
            <Position><LatitudeDegrees>48.1</LatitudeDegrees><LongitudeDegrees>11.5</LongitudeDegrees></Position>
            <AltitudeMeters>520</AltitudeMeters>
            <DistanceMeters>0</DistanceMeters>
            <HeartRateBpm><Value>120</Value></HeartRateBpm>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-10-03T08:10:00Z</Time>
            <DistanceMeters>5000</DistanceMeters>
          </Trackpoint>
        </Track>
      </Lap>
      <Lap StartTime="2026-10-03T08:12:00Z">
        <TotalTimeSeconds>300</TotalTimeSeconds>
        <DistanceMeters>2000</DistanceMeters>
        <AverageHeartRateBpm><Value>160</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>175</Value></MaximumHeartRateBpm>
      </Lap>
      <Creator><Name>Forerunner 265</Name></Creator>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

describe('GPX', () => {
  it('liest Punkte, Puls, Name, Sportart und Herkunft', () => {
    const [activity] = parseGpx(sampleGpx(run));
    expect(activity).toMatchObject({
      format: 'gpx',
      device: 'StravaGPX',
      sport: 'run',
      title: 'Abendlauf',
      startTime: START,
      distanceMeters: null,
    });
    expect(activity!.points).toHaveLength(4);
    expect(activity!.points[3]).toMatchObject({
      time: START + 30_000,
      heartRate: 143,
      altitude: 41,
    });
    expect(activity!.points[0]!.lat).toBeCloseTo(52.5, 6);
  });

  it('braucht Zeitangaben und gültiges XML', () => {
    const route =
      '<gpx xmlns="http://www.topografix.com/GPX/1/1"><rte><rtept lat="1" lon="2"/></rte></gpx>';
    expect(() => parseGpx(route)).toThrow(ImportFileError);
    expect(() => parseGpx('<gpx><trk>')).toThrow('kein gültiges XML');
  });
});

describe('TCX', () => {
  it('summiert Runden und gewichtet den Durchschnittspuls nach Dauer', () => {
    const [activity] = parseTcx(TCX);
    expect(activity).toMatchObject({
      format: 'tcx',
      device: 'Forerunner 265',
      sport: 'ride',
      startTime: Date.parse('2026-10-03T08:00:00Z'),
      timerSeconds: 900,
      distanceMeters: 7000,
      calories: 150,
      avgHeartRate: 140,
      maxHeartRate: 175,
    });
    expect(activity!.points).toHaveLength(2);
    expect(activity!.points[0]).toMatchObject({
      lat: 48.1,
      lon: 11.5,
      altitude: 520,
      heartRate: 120,
      distance: 0,
    });
    expect(activity!.laps.map((lap) => lap.startSeconds)).toEqual([0, 720]);
  });
});

describe('Erkennung', () => {
  it('unterscheidet GPX und TCX am Inhalt', () => {
    expect(isXml(sampleGpx(run))).toBe('gpx');
    expect(isXml(TCX)).toBe('tcx');
    expect(isXml('{"a":1}')).toBeNull();
  });

  it('bildet Sportarten aus Text ab', () => {
    expect(sportFromText('running')).toBe('run');
    expect(sportFromText('Trail Running')).toBe('run');
    expect(sportFromText('Biking')).toBe('ride');
    expect(sportFromText('cycling')).toBe('ride');
    expect(sportFromText('9')).toBe('run');
    expect(sportFromText('1')).toBe('ride');
    expect(sportFromText('hiking')).toBe('hike');
    expect(sportFromText('walking')).toBe('hike');
    expect(sportFromText('open_water_swimming')).toBe('swim');
    expect(sportFromText('Yoga')).toBe('mobility');
    expect(sportFromText('Other')).toBe('other');
    expect(sportFromText(null)).toBe('other');
  });
});
