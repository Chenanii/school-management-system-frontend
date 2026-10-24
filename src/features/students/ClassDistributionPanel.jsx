import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function ClassDistributionPanel({ distribution, loading, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const classes = distribution?.classes || [];
  const visibleClasses = expanded ? classes : classes.slice(0, 4);
  const highestLevelCount = Math.max(1, ...classes.map((level) => level.students));
  const highestGroupCount = Math.max(1, ...classes.flatMap((level) => [
    ...level.groups.map((group) => group.students), level.unassignedStudents,
  ]));

  return (
    <section className={`panel class-distribution-panel ${compact ? 'class-distribution-compact' : ''}`}>
      <div className="panel-heading class-distribution-heading">
        <div className="class-distribution-title">
          <span className="class-distribution-icon"><BarChart3 size={18} /></span>
          <div><h2>Student distribution by class</h2><p>{distribution?.term ? `${distribution.term.academicYear.name} · ${distribution.term.sequence}. ${distribution.term.name} · active enrollments` : 'Active students by class'}</p></div>
        </div>
        <div className="class-distribution-heading-actions">
          {distribution && <span className="class-distribution-total"><Users size={15} /> {distribution.totalStudents} students</span>}
          {!loading && classes.length > 0 && <button className="class-distribution-toggle" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
            {expanded ? 'Show summary' : 'View all distribution'} {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>}
        </div>
      </div>
      {loading ? <div className="table-message"><span className="loading-line" /></div>
        : !classes.length ? <div className="class-distribution-empty">No class levels are set up yet.</div>
          : <>
            <div className="class-distribution-metrics">
              <div><span>Class levels</span><strong>{classes.length}</strong></div>
              <div><span>Class groups</span><strong>{distribution.classGroupCount}</strong></div>
              <div><span>Awaiting group placement</span><strong>{distribution.unassignedStudents}</strong></div>
            </div>
            <div className={`class-distribution-list ${expanded ? 'class-distribution-list-expanded' : ''}`}>
            {visibleClasses.map((level) => (
              <div className="class-distribution-level" key={level.id}>
                <div className="class-distribution-row">
                  <strong>{level.name}</strong><span>{level.students}</span>
                </div>
                <div className="class-distribution-track" aria-label={`${level.name}: ${level.students} active students`}><span style={{ width: `${(level.students / highestLevelCount) * 100}%` }} /></div>
                {level.groups.length > 0 || level.unassignedStudents > 0 ? <div className="class-distribution-groups">
                  {level.groups.map((group) => <div className="class-distribution-group" key={group.id}>
                    <span>{group.name}</span><span>{group.students}</span>
                    <div className="class-distribution-group-track"><span style={{ width: `${(group.students / highestGroupCount) * 100}%` }} /></div>
                  </div>)}
                  {level.unassignedStudents > 0 && <div className="class-distribution-group class-distribution-unassigned">
                    <span>Not assigned to a group</span><span>{level.unassignedStudents}</span>
                    <div className="class-distribution-group-track"><span style={{ width: `${(level.unassignedStudents / highestGroupCount) * 100}%` }} /></div>
                  </div>}
                </div> : <div className="class-distribution-no-groups">No class groups</div>}
              </div>
            ))}
            </div>
          </>}
    </section>
  );
}
